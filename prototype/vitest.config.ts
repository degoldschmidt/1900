import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __DEBUG__: 'true',
    __BUILD_ID__: JSON.stringify('test'),
  },
  oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
  test: {
    environment: 'node',
    include: ['kit/test/**/*.test.ts', 'tools/**/test/**/*.test.ts', 'games/*/test/**/*.test.ts'],
    testTimeout: 60_000,
  },
});
