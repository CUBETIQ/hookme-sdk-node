# Hookme SDK for Node

A simple way to send webhook request to the server.

-   [x] Send webhook request with payload.
-   [x] Cache the request if the server is not available and send it later.
-   [ ] Support retry mechanism.
-   [x] Check the duplicate request before sending (If the request is sending, drop the request).

## Usages

```typescript
// Import the HookmeClient SDK
import HookmeClient from '@cubetiq/hookme-sdk';

// Create the HookmeClient instance
const sdk = HookmeClient.create(
    url: 'hookme_url',
    tenantId: 'default',
    apiKey: 'api_key',
);

// Send the webhook request
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
// Output: {"provider":"","data":{"configs":{"chat_id":123},"message":"Hello, world!"}}
console.log("Response: ", response);
// Output: {id: "gKw9yH0vq7YGm-yqeiNMlg=="",status: "pending",created_at: "2024-05-29T11:17:45.295Z"}
```

### Contributors

-   Sambo Chea <sombochea@cubetiqs.com>
