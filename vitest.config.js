import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['test/visual/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
    },
  },
});
