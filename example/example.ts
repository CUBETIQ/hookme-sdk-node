import { HookmeClient, Store, Logs } from "../src";

Logs.setLevel("i");
const store = Store.file("./data/me/test/caches.json");
const sdk = HookmeClient.local(store);

console.log("SDK: ", sdk.getVersionInfo());

// for (let i = 0; i < 100; i++) {
//     sdk.enqueue({
//         provider: "telegram",
//         data: {
//             message: `This is a test message => ${i + 1}`,
//         },
//     });
// }