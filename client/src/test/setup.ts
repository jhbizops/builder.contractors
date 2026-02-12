import '@testing-library/jest-dom/vitest';

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

if (typeof window === 'undefined') {
  class NoopResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  globalThis.ResizeObserver = NoopResizeObserver as unknown as typeof ResizeObserver;
} else {
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

  globalThis.ResizeObserver = ResizeObserver as unknown as typeof ResizeObserver;
}
