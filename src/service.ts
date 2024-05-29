import axios, { AxiosResponse } from 'axios';
import { HookmeClient } from './hookme';
import { WebhookRequest } from './model';

export class HookmeClientService {
  static async post(
    url: string,
    tenantId: string,
    apiKey: string,
    request: WebhookRequest,
  ): Promise<AxiosResponse> {

    if (!url) {
      throw new Error('url is required');
    }

    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    const response = await axios.post(`${url}/api/v1/${tenantId}/webhook`, {
      provider: request.provider,
      data: request.data,
    }, {
      headers: {
        'User-Agent': HookmeClient.userAgent,
        'x-api-key': apiKey,
        'x-request-id': request._request_id || undefined,
      },
    });

    return response;
  }
}
