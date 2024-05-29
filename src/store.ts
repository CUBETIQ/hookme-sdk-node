import { Logs } from "./logger";

export interface IStore {
    set(key: string, value: any): void;
    get(key: string): any;
    delete(key: string): void;
    getAll(): Map<string, any>;
    has(key: string): boolean;
    clear(): void;
}

// Map Store works in both the browser (client-side) and Node.js (server-side), but it doesn't persist data
export class MapStore implements IStore {
    private store: Map<string, any>;

    constructor() {
        this.store = new Map();
    }

    set(key: string, value: any): void {
        this.store.set(key, value);
    }

    get(key: string): any {
        return this.store.get(key);
    }

    delete(key: string): void {
        this.store.delete(key);
    }

    getAll(): Map<string, any> {
        return this.store;
    }

    has(key: string): boolean {
        return this.store.has(key);
    }

    clear(): void {
        this.store.clear();
    }
}

// Local Storage only works in the browser (client-side)
export class LocalStorageStore implements IStore {
    set(key: string, value: any): void {
        localStorage.setItem(key, JSON.stringify(value));
    }

    get(key: string): any {
        return JSON.parse(localStorage.getItem(key) as string);
    }

    delete(key: string): void {
        localStorage.removeItem(key);
    }

    getAll(): Map<string, any> {
        const store = new Map<string, any>();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) as string;
            store.set(key, JSON.parse(localStorage.getItem(key) as string));
        }
        return store;
    }

    has(key: string): boolean {
        return localStorage.getItem(key) !== null;
    }

    clear(): void {
        localStorage.clear();
    }

}

// File Store only works in Node.js (server-side)
export class FileStore implements IStore {
    private store: Map<string, any>;
    private path: string;
    private fs = require('fs');

    constructor(path: string) {
        this.path = path;
        if (this.fs.existsSync(this.path)) {
            const data = this.fs.readFileSync(this.path);
            this.store = new Map(JSON.parse(data));
            Logs.d(`[FileStore] file store loaded: ${this.path} with ${this.store.size} entries`);
        } else {
            this.store = new Map();
        }
    }

    set(key: string, value: any): void {
        this.store.set(key, value);
        this.fs.writeFileSync(this.path, JSON.stringify(Array.from(this.store.entries())));
    }

    get(key: string): any {
        return this.store.get(key);
    }

    delete(key: string): void {
        this.store.delete(key);
        this.fs.writeFileSync(this.path, JSON.stringify(Array.from(this.store.entries())));
    }

    getAll(): Map<string, any> {
        return this.store;
    }

    has(key: string): boolean {
        return this.store.has(key);
    }

    clear(): void {
        this.store.clear();
        this.fs.writeFileSync(this.path, JSON.stringify(Array.from(this.store.entries())));
    }
}