import { Store } from '../src/store';

const store = Store.file("caches.test.json");

test('File store should be able to set and get value', () => {
    store.set("key3", "value3");
    const value = store.get("key3");
    expect(value).toBeDefined();
    expect(value).not.toBeNull();
    expect(value).not.toBe('');
    expect(value).toBe('value3');
})