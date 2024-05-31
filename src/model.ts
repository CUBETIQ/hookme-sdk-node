import { DEFAULT_HOOKME_URL } from "./config";
import { LogLevel, Logs } from "./logger";
import { IStore } from "./store";
import { generatedID } from "./util";

export class HookmeClientOptions {
    tenantId?: string;
    apiKey?: string;
    url?: string;
    store?: IStore;
    retryInterval?: number; // in seconds
    emitInterval?: number; // in seconds
    logLevel?: LogLevel; // default 'Logs.getLevel()'

    constructor(tenantId: string, apiKey: string, url?: string, store?: IStore, retryInterval?: number, emitInterval?: number, logLevel?: LogLevel) {
        this.tenantId = tenantId;
        this.apiKey = apiKey;
        this.url = url ? url : DEFAULT_HOOKME_URL;
        this.store = store;
        this.retryInterval = retryInterval ? retryInterval : 5;
        this.emitInterval = emitInterval ? emitInterval : 1;
        this.logLevel = logLevel ? logLevel : Logs.getLevel();
    }

    static builder(): HookmeClientOptionsBuilder {
        return new HookmeClientOptionsBuilder();
    }
}

class HookmeClientOptionsBuilder {
    private _tenantId: string;
    private _apiKey: string;
    private _url: string;
    private _store?: IStore;
    private _retryInterval?: number;
    private _emitInterval?: number;
    private _logLevel?: LogLevel;

    constructor() {
        this._tenantId = 'default';
        this._apiKey = '';
        this._url = DEFAULT_HOOKME_URL;
        this._store = undefined;
        this._retryInterval = 5;
        this._emitInterval = 1;
        this._logLevel = Logs.getLevel();
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

    store(store: IStore): HookmeClientOptionsBuilder {
        this._store = store;
        return this;
    }

    retryInterval(retryInterval: number): HookmeClientOptionsBuilder {
        this._retryInterval = retryInterval;
        return this;
    }

    emitInterval(emitInterval: number): HookmeClientOptionsBuilder {
        this._emitInterval = emitInterval;
        return this;
    }

    logLevel(logLevel: LogLevel): HookmeClientOptionsBuilder {
        this._logLevel = logLevel;
        return this;
    }

    build(): HookmeClientOptions {
        return new HookmeClientOptions(this._tenantId, this._apiKey, this._url, this._store, this._retryInterval, this._emitInterval, this._logLevel);
    }
}

export type ProviderType = 'telegram' | 'discord' | 'email';

export class WebhookRequest {
    provider: ProviderType | string;
    data: any;
    // please ignore this field, it's only used for internal request only
    _request_id?: string;
    _created_at?: Date;

    constructor(provider: ProviderType | string, data: any, _request_id?: string, _created_at?: Date) {
        this.provider = provider;
        this.data = data;
        this._request_id = _request_id ? _request_id : generatedID();
        this._created_at = _created_at ? _created_at : new Date();
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