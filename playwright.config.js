import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3473',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npx serve . --listen 3473',
    port: 3473,
    reuseExistingServer: !process.env.CI,
  },
});
