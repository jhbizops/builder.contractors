import '@testing-library/jest-dom/vitest';

// Mock localStorage for tests that rely on it
const storage: Record<string, string> = {};

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    },
  },
});

class ResizeObserver {
  observe() {
    // no-op for jsdom
  }

  unobserve() {
    // no-op for jsdom
  }

  disconnect() {
    // no-op for jsdom
  }
}

// @ts-expect-error - provide minimal polyfill for tests
global.ResizeObserver = ResizeObserver;
