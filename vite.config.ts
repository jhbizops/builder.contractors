import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import { cartographer } from '@replit/vite-plugin-cartographer';
import type { VitestEnvironment } from 'vitest';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(() => {
  const plugins = [react(), runtimeErrorOverlay()];

  if (process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined) {
    plugins.push(cartographer());
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'client', 'src'),
        '@shared': path.resolve(rootDir, 'shared'),
        '@assets': path.resolve(rootDir, 'attached_assets'),
      },
    },
    root: path.resolve(rootDir, 'client'),
    build: {
      outDir: path.resolve(rootDir, 'dist/public'),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ['**/.*'],
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './client/src/test/setup.ts',
      include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)', '../server/__tests__/**/*.{test,spec}.ts'],
      environmentMatchGlobs: (
        [
          ['../server/**', 'node'],
        ] satisfies [string, VitestEnvironment][]
      ),
      coverage: {
        provider: 'v8' as const,
        reporter: ['text', 'lcov'],
      },
    },
  };
});
