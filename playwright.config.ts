import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }], ['list']] : [['html', { open: 'never' }], ['list']],
  timeout: 30000,
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter server dev',
      url: 'http://localhost:4000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: 'pnpm --filter client dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
});
