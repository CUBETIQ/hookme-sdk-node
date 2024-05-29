import { DEFAULT_HOOKME_URL } from "./config";

export class HookmeClientOptions {
    tenantId?: string;
    apiKey?: string;
    url?: string;

    constructor(tenantId: string, apiKey: string, url?: string) {
        this.tenantId = tenantId;
        this.apiKey = apiKey;
        this.url = url ? url : DEFAULT_HOOKME_URL;
    }

    static builder(): HookmeClientOptionsBuilder {
        return new HookmeClientOptionsBuilder();
    }
}

class HookmeClientOptionsBuilder {
    private _tenantId: string;
    private _apiKey: string;
    private _url: string;

    constructor() {
        this._tenantId = 'default';
        this._apiKey = '';
        this._url = DEFAULT_HOOKME_URL;
    }

    tenantId(tenantId: string): HookmeClientOptionsBuilder {
        this._tenantId = tenantId;
        return this;
    }

    apiKey(apiKey: string): HookmeClientOptionsBuilder {
        this._apiKey = apiKey;
        return this;
    }

    url(url: string): HookmeClientOptionsBuilder {
        this._url = url;
        return this;
    }

    build(): HookmeClientOptions {
        return new HookmeClientOptions(this._tenantId, this._apiKey, this._url);
    }
}

export type ProviderType = 'telegram' | 'discord' | 'email';

export class WebhookRequest {
    provider: ProviderType | string;
    data: any;

    constructor(provider: ProviderType | string, data: any) {
        this.provider = provider;
        this.data = data;
    }

    static builder(): WebhookRequestBuilder {
        return new WebhookRequestBuilder();
    }
}

class WebhookRequestBuilder {
    private _provider: ProviderType | string;
    private _data: any;

    constructor() {
        this._provider = '';
        this._data = undefined;
    }

    provider(provider: ProviderType | string): WebhookRequestBuilder {
        this._provider = provider;
        return this;
    }

    data(data: any): WebhookRequestBuilder {
        this._data = data;
        return this;
    }

    build(): WebhookRequest {
        return new WebhookRequest(this._provider, this._data);
    }
}

export class WebhookResponse {
    id: string;
    status: string;
    created_at: Date;
    updated_at?: Date | null | undefined;
    error?: string;

    constructor(id: string, status: string, created_at: Date, updated_at?: Date | null | undefined, error?: string) {
        this.id = id;
        this.status = status;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.error = error;
    }

    static fromJson(json: any): WebhookResponse {
        return new WebhookResponse(json.id, json.status, new Date(json.created_at), json.updated_at ? new Date(json.updated_at) : null, json.error);
    }
}