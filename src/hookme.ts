import { HookmeClientService } from './service';
import { PostWebhookFailedException } from './exceptions';
import { Logs } from './logger';
import { HookmeClientOptions, WebhookRequest, WebhookResponse } from './model';
import { AxiosError } from 'axios';
import { IStore } from './store';
import { generatedID } from './util';

export class HookmeClient {
  static readonly version = '0.0.2';
  static readonly versionCode = '2';
  static readonly userAgent = `${HookmeClient.name}:sdk-ts/${HookmeClient.version}-${HookmeClient.versionCode}`;

  private store?: IStore;
  private options: HookmeClientOptions;
  private _isRetryCompleted = false;

  private _retryQueue: WebhookRequest[] = [];
  private _sendingRequests = new Map<string, WebhookRequest>();
  private _emitQueue: WebhookRequest[] = [];

  constructor(options: HookmeClientOptions) {
    this.options = options;
    this.store = options.store;

    // retry failed requests with non-blocking
    this.retryFailedRequests().then(() => {
      this._isRetryCompleted = true;
      Logs.d('[IStore] retrying failed requests completed');
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
    Logs.d(`[IStore] retrying failed requests with interval: ${seconds}`);
    setInterval(() => {
      this.intervalRetryQueue();
    }, seconds * 1000);
  }

  private startProcessEmitQueue(seconds: number): void {
    Logs.d(`[IStore] processing emit queue with interval: ${seconds}`);
    setInterval(() => {
      this.processEmitQueue();
    }, seconds * 1000);
  }

  private async retryFailedRequests(): Promise<void> {
    if (this.store) {
      const requests = this.store.getAll();
      for (const [key, value] of requests) {
        Logs.d(`[IStore] retrying request: ${key}`);
        try {
          await this.post(value);
          this.store.delete(key);
        } catch (error) {
          Logs.e(`[IStore] failed to retry request: ${key}`);
        }
      }
    }
  }

  private async intervalRetryQueue(): Promise<void> {
    while (this._retryQueue.length > 0) {
      const request = this._retryQueue.shift();
      if (request) {
        try {
          await this.post(request);
        } catch (error) {
          Logs.e(`[IStore] failed to retry request from queue: ${request._request_id}`);
        }
      }
    }
  }

  private async processEmitQueue(): Promise<void> {
    while (this._emitQueue.length > 0) {
      const request = this._emitQueue.shift();
      if (request) {
        try {
          await this.post(request); // should set noBackoff to true and use enqueue instead (when error occurred add to emit queue)
        } catch (error) {
          Logs.e(`failed to post request from emit queue: ${request._request_id}`);
          // add to emit queue if failed to post
          // TODO: add to emit queue
        }
      }
    }
  }

  async waitForRetry(): Promise<void> {
    while (!this._isRetryCompleted) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  async post(request: WebhookRequest, configs?: { noBackoff?: boolean }): Promise<WebhookResponse | null> {
    Logs.d(`post webhook request: ${JSON.stringify(request)}`);

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
      Logs.d(`request is already sending: ${request._request_id}`);
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
        Logs.e(`post webhook failed: ${JSON.stringify(response.data)}`);

        if (configs?.noBackoff !== true) {
          // store the request if failed to post
          this.failedToStoreRequest(request);
        }

        throw new PostWebhookFailedException(response.data?.error || response.data, response.status);
      }

      // remove the request from store if success
      if (this.store && this.store.has(request._request_id!)) {
        this.store.delete(request._request_id!);
        Logs.d(`[IStore] removed the request: ${request._request_id}`);
      }

      Logs.d(`post webhook response: ${JSON.stringify(response.data)}`);
      return WebhookResponse.fromJson(response.data);
    } catch (error) {
      if (configs?.noBackoff !== true) {
        // store the request if failed to post
        this.failedToStoreRequest(request);
      }

      if (error instanceof AxiosError) {
        throw new PostWebhookFailedException(error.response?.data?.error, error.response?.status || responseStatus);
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
    // run in background to avoid blocking
    this._emitQueue.push(request);
  }

  private failedToStoreRequest(request: WebhookRequest): void {
    if (this.store) {
      if (!request._request_id) {
        request._request_id = generatedID();
      }

      this.store.set(request._request_id!, request);
      Logs.d(`[IStore] stored the request: ${request._request_id}`);

      // send to retry queue
      this._retryQueue.push(request);
    }
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
