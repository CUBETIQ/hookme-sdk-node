# Hookme SDK for Node

A simple way to send webhook request to the server.

-   [x] Send webhook request with payload.
-   [x] Cache the request if the server is not available and send it later.
-   [x] Support retry mechanism. (Support interval retry mechanism)
-   [x] Check the duplicate request before sending (If the request is sending, drop the request).
-   [x] Support enqueue the request to the queue.
-   [x] Enhance the enqueue to the queue with storage (Add the storage to store the request for later sending).
-   [ ] Support batch request sending for enqueue.
-   [x] Support scheduler and allow to schedule the job for do webhook callback.
-   [x] Add support Telegram send with photo and file url.

## Usages

```typescript
// Import the HookmeClient SDK
import HookmeClient from '@cubetiq/hookme-sdk';

// Create the HookmeClient instance
const sdk = HookmeClient.create({
    url: 'hookme_url',
    tenantId: 'default',
    apiKey: 'api_key',
});

// Send the webhook request
const request = WebhookRequest.builder()
    .provider('telegram')
    .data({
        telegram: {
            chat_id: 123, // please replace with your chat_id (must a correct chat_id)
            bot_token: '123', // please replace with your bot_token (must a correct bot_token)
        },
        message: 'Hello, world!',
        photo: 'https://example.com/photo.jpg', // please replace with your photo url, if you want to send photo
        file: 'https://example.com/file.pdf', // please replace with your file url, if you want to send file
    })
    .build();

const response = await sdk.post(request);
console.log('Request: ', request);
// Output: {"provider":"telegram","data":{"telegram":{"chat_id":123,"bot_token":"123"},"message":"Hello, world!"}}
console.log('Response: ', response);
// Output: {id: "gKw9yH0vq7YGm-yqeiNMlg=="",status: "pending",created_at: "2024-05-29T11:17:45.295Z"}
```

### Issues

-   When send error with using file store, the interval will auto send the request again and again (this should be change and should delay the with exponential backoff).

### Contributors

-   Sambo Chea <sombochea@cubetiqs.com>
