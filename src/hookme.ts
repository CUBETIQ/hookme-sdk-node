import { HookmeClientService, SchedulerClientService } from './service';
import { PostWebhookFailedException } from './exceptions';
import { Logs } from './logger';
import { HookmeClientOptions, ScheduleJob, ScheduleJobResponse, WebhookRequest, WebhookResponse } from './model';
import { AxiosError } from 'axios';
import { IStore } from './store';
import { generatedID } from './util';
import { DEFAULT_HOOKME_URL } from './config';

export class HookmeClient {
  static readonly version = '0.0.10';
  static readonly versionCode = '10';
  static readonly userAgent = `${HookmeClient.name}:sdk-ts/${HookmeClient.version}-${HookmeClient.versionCode}`;

  private store?: IStore;
  private options: HookmeClientOptions;
  private _isRetryCompleted = false;

  private _retryRequests = new Map<string, WebhookRequest>();
  private _sendingRequests = new Map<string, WebhookRequest>();
  private _emitQueue: WebhookRequest[] = [];
  private _delayedNextRequestInSeconds = 1;

  constructor(options: HookmeClientOptions) {
    // set log level
    Logs.setLevel(options.logLevel ? options.logLevel : Logs.getLevel());

    // set options and store
    this.options = options;
    this.store = options.store;

    if (!this.options.url) {
      this.options.url = DEFAULT_HOOKME_URL
    }

    if (!this.options.tenantId) {
      throw new Error('options.tenantId is required!');
    }

    Logs.d(`[constructor] HookmeClient initialized with url: ${options.url} tenant: ${options.tenantId} and store: ${this.store ? 'enabled' : 'disabled'}`);

    // retry failed requests with non-blocking
    this.retryFailedRequests().then(() => {
      this._isRetryCompleted = true;
      Logs.d('[retryFailedRequests] retrying failed requests completed');
    });

    // interval retry queue
    const retryInterval = this.options.retryInterval ? this.options.retryInterval : 5; // default 5 seconds
    if (retryInterval && retryInterval > 0) {
      this.startIntervalRetryQueue(retryInterval);
    }

    // process emit queue
    const emitInterval = this.options.emitInterval ? this.options.emitInterval : 1; // default 1 second
    if (emitInterval && emitInterval > 0) {
      this.startProcessEmitQueue(emitInterval);
    }
  }

  private startIntervalRetryQueue(seconds: number): void {
    Logs.d(`[startIntervalRetryQueue] retrying failed requests with interval: ${seconds} seconds`);

    // create a new promise to avoid blocking the main thread
    new Promise(async (resolve) => {
      while (true) {
        // wait for seconds
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
        await this.intervalRetryQueue();
      }
    });

    Logs.d(`[startIntervalRetryQueue] retrying failed requests started`);
  }

  private startProcessEmitQueue(seconds: number): void {
    Logs.d(`[startProcessEmitQueue] processing emit queue with interval: ${seconds} seconds`);

    // create a new promise to avoid blocking the main thread
    new Promise(async (resolve) => {
      while (true) {
        // wait for seconds
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
        await this.processEmitQueue();
      }
    });

    Logs.d(`[startProcessEmitQueue] processing emit queue started`);
  }

  private async retryFailedRequests(): Promise<void> {
    if (this.store) {
      const requests = this.store.getAll();
      Logs.v(`[retryFailedRequests] retrying failed total requests: ${requests.size}`);

      for (const [key, value] of requests) {
        Logs.d(`[retryFailedRequests] retrying request: ${key}`);
        try {
          await this.post(value);
          this.store.delete(key);
          Logs.d(`[retryFailedRequests.IStore] removed the request: ${key}`);

          // wait for next request (to avoid brute force)
          await new Promise((resolve) => setTimeout(resolve, this._delayedNextRequestInSeconds * 1000));
        } catch (error) {
          Logs.e(`[retryFailedRequests] failed to retry request: ${key} with error: ${error}`);
        }
      }
    }
  }

  private async intervalRetryQueue(): Promise<void> {
    Logs.v(`[intervalRetryQueue] retrying failed total requests: ${this._retryRequests.size}`);

    for (const [key, value] of this._retryRequests) {
      Logs.d(`[intervalRetryQueue] retrying request: ${key}`);
      try {
        await this.post(value, { noBackoff: true });
        this._retryRequests.delete(key);
        Logs.d(`[intervalRetryQueue] removed the request: ${key}`);

        // wait for next request (to avoid brute force)
        await new Promise((resolve) => setTimeout(resolve, this._delayedNextRequestInSeconds * 1000));
      } catch (error) {
        Logs.e(`[intervalRetryQueue] failed to retry request: ${key} with error: ${error}`);
      }
    }
  }

  private async processEmitQueue(): Promise<void> {
    Logs.v(`[processEmitQueue] processing emit queue total requests: ${this._emitQueue.length}`);

    while (this._emitQueue.length > 0) {
      const request = this._emitQueue.shift();
      if (request) {
        try {
          await this.post(request); // should set noBackoff to true and use enqueue instead (when error occurred add to emit queue)

          // if success, remove from the store
          if (this.store && this.store.has(request._request_id!)) {
            this.store.delete(request._request_id!);
            Logs.d(`[processEmitQueue.IStore] removed the request: ${request._request_id}`);
          }

          // wait for next request (to avoid brute force)
          await new Promise((resolve) => setTimeout(resolve, this._delayedNextRequestInSeconds * 1000));
        } catch (error) {
          Logs.e(`[processEmitQueue] failed to post request from emit queue: ${request._request_id} with error: ${error}`);
          // add to emit queue if failed to post
          setTimeout(() => {
            this._emitQueue.push(request);
          }, 5000); // retry after 5 seconds
        }
      }
    }
  }

  async waitForRetry(): Promise<void> {
    Logs.v(`[waitForRetry] waiting for retry to complete`);
    while (!this._isRetryCompleted) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  async post(request: WebhookRequest, configs?: { noBackoff?: boolean }): Promise<WebhookResponse | null> {
    Logs.d(`[post] post webhook request: ${JSON.stringify(request)}`);

    if (!request.provider) {
      throw new PostWebhookFailedException('provider is required', 400);
    }

    if (!request.data) {
      throw new PostWebhookFailedException('data is required', 400);
    }

    if (!this.options.url) {
      throw new PostWebhookFailedException('url is required', 400);
    }

    // set the generated request id if not set
    if (!request._request_id) {
      request._request_id = generatedID();
    }

    // check if the request is already sending
    if (this._sendingRequests.has(request._request_id)) {
      Logs.d(`[post] request is already sending: ${request._request_id}`);
      return null;
    } else {
      // add the request to sending map
      this._sendingRequests.set(request._request_id, request);
    }

    let responseStatus = 500;
    try {
      const response = await HookmeClientService.post(
        this.options.url!,
        this.options.tenantId ? this.options.tenantId : 'default',
        this.options.apiKey ? this.options.apiKey : '',
        request
      );

      responseStatus = response.status;
      if (response.status !== 200) {
        Logs.e(`[post] post webhook failed: ${JSON.stringify(response.data)}`);

        if (configs?.noBackoff !== true) {
          // store the request if failed to post
          this.failedToStoreRequest(request);
        }

        throw new PostWebhookFailedException(response.data?.error || response.data, response.status);
      }

      // remove the request from store if success
      if (this.store && this.store.has(request._request_id!)) {
        this.store.delete(request._request_id!);
        Logs.d(`[post.IStore] removed the request: ${request._request_id}`);
      }

      Logs.d(`[post] post webhook response: ${JSON.stringify(response.data)}`);
      return WebhookResponse.fromJson(response.data);
    } catch (error) {
      if (configs?.noBackoff !== true) {
        // store the request if failed to post
        this.failedToStoreRequest(request);
      }

      Logs.d(`[post] post webhook failed with error: ${JSON.stringify(error)}`);
      if (error instanceof AxiosError) {
        const err = error.response?.data?.error || error.response?.data;
        if (err) {
          throw new PostWebhookFailedException(err, error.response?.status || responseStatus);
        } else {
          throw error;
        }
      } else {
        throw new PostWebhookFailedException(JSON.stringify(error), responseStatus);
      }
    } finally {
      // remove the request from sending map after post request (success or failed)
      this._sendingRequests.delete(request._request_id);
    }
  }

  // enqueue the request to emit queue
  enqueue(request: WebhookRequest): void {
    if (!request._request_id) {
      request._request_id = generatedID();
    }

    if (!request._created_at) {
      request._created_at = new Date();
    }

    // run in background to avoid blocking
    this._emitQueue.push(request);
    Logs.d(`[enqueue] enqueued the request: ${request._request_id}`);

    // store the request
    if (this.store) {
      this.store.set(request._request_id, request);
      Logs.d(`[enqueue.IStore] stored the request: ${request._request_id}`);
    }
  }

  private failedToStoreRequest(request: WebhookRequest): void {
    if (this.store) {
      if (!request._request_id) {
        request._request_id = generatedID();
      }

      if (!request._created_at) {
        request._created_at = new Date();
      }

      // Avoiding writing the same request to store multiple times (so just ignore it if already stored)
      if (this.store.has(request._request_id!)) {
        Logs.d(`[failedToStoreRequest.IStore] request is already stored: ${request._request_id}`);
      } else {
        this.store.set(request._request_id!, request);
        Logs.d(`[failedToStoreRequest.IStore] stored the request: ${request._request_id}`);
      }

      // add to retry queue
      if (this._retryRequests.has(request._request_id)) {
        Logs.d(`[failedToStoreRequest] request is already in retry queue: ${request._request_id}`);
      } else {
        this._retryRequests.set(request._request_id, request);
        Logs.d(`[failedToStoreRequest] added to retry queue: ${request._request_id}`);
      }
    }
  }

  // create a scheduled webhook endpoint (to be trigger in the future) and backed by hookme scheduler
  async schedule(key: string, job: ScheduleJob): Promise<ScheduleJobResponse> {
    Logs.d(`[schedule] scheduling job with key: ${key}`);

    const resp = await SchedulerClientService.schedule(
      this.options.url!,
      this.options.tenantId ? this.options.tenantId : 'default',
      this.options.apiKey ? this.options.apiKey : '',
      key,
      job
    );

    Logs.d(`[schedule] scheduled job response: ${JSON.stringify(resp.data)}`);
    return ScheduleJobResponse.fromJson(resp.data);
  }

  async unschedule(key: string): Promise<void> {
    Logs.d(`[unschedule] unscheduling job with key: ${key}`);

    const resp = await SchedulerClientService.unschedule(
      this.options.url!,
      this.options.tenantId ? this.options.tenantId : 'default',
      this.options.apiKey ? this.options.apiKey : '',
      key,
    );

    Logs.d(`[unschedule] unscheduled job response: ${JSON.stringify(resp.data)}`);
  }

  getVersionInfo(): string {
    return HookmeClient.userAgent;
  }

  static create(options: HookmeClientOptions): HookmeClient {
    return new HookmeClient(options);
  }

  static local(store?: IStore): HookmeClient {
    return new HookmeClient({
      url: 'http://localhost:5001',
      store: store,
    });
  }
}
