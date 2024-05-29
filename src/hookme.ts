import { HookmeClientService } from './service';
import { PostWebhookFailedException } from './exceptions';
import { Logs } from './logger';
import { HookmeClientOptions, WebhookRequest, WebhookResponse } from './model';
import { AxiosError } from 'axios';

export class HookmeClient {
  static readonly version = '0.0.1';
  static readonly versionCode = '1';
  static readonly userAgent = `${HookmeClient.name}:sdk-ts/${HookmeClient.version}-${HookmeClient.versionCode}`;

  private options: HookmeClientOptions;

  constructor(options: HookmeClientOptions) {
    this.options = options;
  }

  async post(request: WebhookRequest): Promise<WebhookResponse | null> {
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
        throw new Error(`post webhook failed: ${response.data}`);
      }

      Logs.d(`post webhook response: ${JSON.stringify(response.data)}`);
      return WebhookResponse.fromJson(response.data);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new PostWebhookFailedException(error.response?.data?.error, error.response?.status || responseStatus);
      } else {
        throw new PostWebhookFailedException(JSON.stringify(error), responseStatus);
      }
    }
  }

  getVersionInfo(): string {
    return HookmeClient.userAgent;
  }

  static create(options: HookmeClientOptions): HookmeClient {
    return new HookmeClient(options);
  }

  static local(): HookmeClient {
    return new HookmeClient({
      url: 'http://localhost:5001',
    });
  }
}
