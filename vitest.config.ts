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
    // Order matters: Vite checks aliases in array order and takes the first
    // match, so the more specific `@/content` entry must come before `@`.
    alias: [
      { find: '@/content', replacement: path.resolve(__dirname, './content') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
});
