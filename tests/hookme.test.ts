import { PostWebhookFailedException } from '../src/exceptions';
import { HookmeClient, HookmeClientOptions, WebhookRequest } from '../src/index';
import { FileStore } from '../src/store';

const API_KEY = 'hm_xxx'

const store = new FileStore("caches.json");
// const sdk = HookmeClient.create(
//     HookmeClientOptions.builder()
//         .tenantId('default')
//         .apiKey(API_KEY)
//         .store(store)
//         .build()
// )

const sdk = HookmeClient.local(store);

test('Hookme client sdk should be defined', () => {
    expect(sdk).toBeDefined();
});

test('Hookme client sdk should be able to post webhook request', async () => {
    const request = WebhookRequest.builder()
        .provider("telegram")
        .data({
            configs: {
                chat_id: 123,
            },
            message: "Hello, world!",
        })
        .build();

    const response = await sdk.post(request);
    console.log("Request: ", request);
    console.log("Response: ", response);

    expect(request.provider).toBeDefined();
    expect(request.provider).not.toBeNull();
    expect(request.provider).not.toBe('');
    expect(request.data).toBeDefined();
    expect(request.data).not.toBeNull();
    expect(request.data).not.toBe('');

    expect(response).toBeDefined();
    expect(response).not.toBeNull();
    expect(response).not.toBe('');
    expect(response?.id).toBeDefined();
    expect(response?.id).not.toBeNull();
    expect(response?.id).not.toBe('');
    expect(response?.status).toBeDefined();
    expect(response?.status).not.toBeNull();
    expect(response?.status).not.toBe('');
    expect(response?.status).toBe('pending');
    expect(response?.created_at).toBeDefined();
    expect(response?.created_at).not.toBeNull();
    expect(response?.created_at).not.toBe('');
});

test('Hookme client sdk should be able to post webhook request with invalid provider', async () => {
    const request = WebhookRequest.builder()
        .provider("")
        .data({
            configs: {
                chat_id: 123,
            },
            message: "Hello, world!",
        })
        .build();

    try {
        await sdk.post(request);
    } catch (error) {
        if (error instanceof Error) {
            expect(error.message).toBe('provider is required');
        } else if (error instanceof PostWebhookFailedException) {
            expect(error.message).toBe('provider is required');
            expect(error.status).toBe(400);
        }
    }
});

test('Hookme client sdk should be able to post webhook request with invalid data', async () => {
    const request = WebhookRequest.builder()
        .provider("telegram")
        .build();

    try {
        await sdk.post(request);
    } catch (error) {
        if (error instanceof Error) {
            expect(error.message).toBe('data is required');
        } else if (error instanceof PostWebhookFailedException) {
            expect(error.message).toBe('data is required');
            expect(error.status).toBe(400);
        }
    }
});

test('Hookme client sdk should be able to wait for retry', async () => {
    await sdk.waitForRetry();
});