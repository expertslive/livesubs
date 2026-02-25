import '@testing-library/jest-dom/vitest';

// Node.js 22+ has a built-in localStorage that lacks standard methods like clear().
// Replace it with a proper Storage implementation for tests.
const store = new Map<string, string>();
const localStorageMock: Storage = {
	getItem: (key: string) => store.get(key) ?? null,
	setItem: (key: string, value: string) => { store.set(key, String(value)); },
	removeItem: (key: string) => { store.delete(key); },
	clear: () => { store.clear(); },
	get length() { return store.size; },
	key: (index: number) => [...store.keys()][index] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

beforeEach(() => {
	store.clear();
});
