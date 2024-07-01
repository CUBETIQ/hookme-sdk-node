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

export type ScheduleJobType = 'cron' | 'interval';

// This cron expression is with seconds (e.g. '*/5 * * * * *' for every 5 seconds)
export const CronExpression = {
    Every5Seconds: '*/5 * * * * *',
    Every10Seconds: '*/10 * * * * *',
    Every30Seconds: '*/30 * * * * *',
    Every1Minute: '0 * * * * *',
    Every5Minutes: '*/5 * * * * *',
    Every10Minutes: '*/10 * * * * *',
    Every30Minutes: '*/30 * * * * *',
    Every1Hour: '0 0 * * * *',
    Every6Hours: '0 0 */6 * * *',
    Every12Hours: '0 0 */12 * * *',
}

export class ScheduleJob {
    webhook_url: string;
    webhook_data: any;
    type: ScheduleJobType;
    // cron e.g. '*/5 * * * * *' for every 5 seconds or '0 0 12 * * *' for every day at 12:00 PM
    // interval e.g. '5s' for every 5 seconds or '1h' for every 1 hour (unit: s, m, h, d, w)
    schedule: string;
    webhook_headers?: Record<string, string>;
    tz?: string;

    constructor(webhook_url: string, webhook_data: any, type: ScheduleJobType, schedule: string, webhook_headers?: Record<string, string>, tz?: string) {
        this.webhook_url = webhook_url;
        this.webhook_data = webhook_data;
        this.webhook_headers = webhook_headers;
        this.type = type;
        this.schedule = schedule;
        this.tz = tz;
    }

    static builder(): ScheduleJobBuilder {
        return new ScheduleJobBuilder();
    }
}

class ScheduleJobBuilder {
    private _webhook_url: string;
    private _webhook_data: any;
    private _webhook_headers?: Record<string, string>;
    private _type: ScheduleJobType;
    private _schedule: string;
    private _tz?: string;

    constructor() {
        this._webhook_url = '';
        this._webhook_data = undefined;
        this._webhook_headers = undefined;
        this._type = 'cron';
        this._schedule = '';
        this._tz = undefined;
    }

    webhook_url(webhook_url: string): ScheduleJobBuilder {
        this._webhook_url = webhook_url;
        return this;
    }

    webhook_data(webhook_data: any): ScheduleJobBuilder {
        this._webhook_data = webhook_data;
        return this;
    }

    webhook_headers(webhook_headers?: Record<string, string>): ScheduleJobBuilder {
        this._webhook_headers = webhook_headers;
        return this;
    }

    type(type: ScheduleJobType): ScheduleJobBuilder {
        this._type = type;
        return this;
    }

    schedule(schedule: string): ScheduleJobBuilder {
        this._schedule = schedule;
        return this;
    }

    tz(tz: string): ScheduleJobBuilder {
        this._tz = tz;
        return this;
    }

    build(): ScheduleJob {
        return new ScheduleJob(this._webhook_url, this._webhook_data, this._type, this._schedule, this._webhook_headers, this._tz);
    }
}

export class ScheduleJobResponse {
    key: string;
    job_id: string;
    job_status: number; // 100: not started, 200: scheduled, 300: running, 400: failed, 500: terminated, 600: completed
    type: ScheduleJobType;
    next_run?: Date;
    last_run?: Date;
    created_at?: Date;
    updated_at?: Date;

    constructor(key: string, job_id: string, job_status: number, type: ScheduleJobType, next_run?: Date, last_run?: Date, created_at?: Date, updated_at?: Date) {
        this.key = key;
        this.job_id = job_id;
        this.job_status = job_status;
        this.type = type;
        this.next_run = next_run;
        this.last_run = last_run;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    static fromJson(json: any): ScheduleJobResponse {
        return new ScheduleJobResponse(json.key, json.job_id, json.job_status, json.type, json.next_run ? new Date(json.next_run) : undefined, json.last_run ? new Date(json.last_run) : undefined, new Date(json.created_at), json.updated_at ? new Date(json.updated_at) : undefined);
    }
}