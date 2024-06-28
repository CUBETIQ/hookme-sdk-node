import axios, { AxiosResponse } from 'axios';
import { HookmeClient } from './hookme';
import { ScheduleJob, WebhookRequest } from './model';

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

export class SchedulerClientService {
  static async schedule(
    url: string,
    tenantId: string,
    apiKey: string,
    key: string,
    job: ScheduleJob,
  ): Promise<AxiosResponse> {

    if (!key) {
      throw new Error('key is required');
    }

    if (!url) {
      throw new Error('url is required');
    }

    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    const response = await axios.post(`${url}/api/v1/${tenantId}/scheduler/${key}`, job, {
      headers: {
        'User-Agent': HookmeClient.userAgent,
        'x-api-key': apiKey,
        'x-request-id': new Date().getTime().toString(),
      },
    });

    return response;
  }

  static async unschedule(
    url: string,
    tenantId: string,
    apiKey: string,
    key: string,
  ): Promise<AxiosResponse> {

    if (!key) {
      throw new Error('key is required');
    }

    if (!url) {
      throw new Error('url is required');
    }

    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    const response = await axios.delete(`${url}/api/v1/${tenantId}/scheduler/${key}`, {
      headers: {
        'User-Agent': HookmeClient.userAgent,
        'x-api-key': apiKey,
        'x-request-id': new Date().getTime().toString(),
      },
    });

    return response;
  }
}