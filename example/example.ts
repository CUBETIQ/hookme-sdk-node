import { HookmeClient, Store, Logs } from "../src";

Logs.setLevel("d");
const store = Store.file("./caches.test.json");
const sdk = HookmeClient.create({
    store: store,
})

console.log("SDK: ", sdk.getVersionInfo());

for (let i = 0; i < 1; i++) {
    sdk.enqueue({
        provider: "telegram",
        data: {
            message: `This is a test message => ${i + 1}`,
        },
    });
}