import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Mirrors the path aliases in tsconfig.json so tests can import with the same
// `@/...` specifiers as the app code.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
