import { HookmeClient, Store, Logs } from "../src";

Logs.setLevel("d");
const store = Store.file("./caches.test.json");
// const sdk = HookmeClient.create({
//     store: store,
//     tenantId: "default",
// })
const sdk = HookmeClient.local(store)

console.log("SDK: ", sdk.getVersionInfo());

for (let i = 0; i < 50; i++) {
    for (let j = 0; j < 10; j++) {
        sdk.enqueue({
            provider: "telegram",
            data: {
                message: `This is a test message => ${i + j}`,
            },
        });
    }
}