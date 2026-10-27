import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5190',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node --env-file-if-exists=.env.test.local server/index.js',
      url: 'http://127.0.0.1:3188/health',
      reuseExistingServer: false,
      env: { PORT: '3188', API_ALLOWED_ORIGIN: 'http://127.0.0.1:5190' },
    },
    {
      command: 'vite --host 127.0.0.1 --port 5190 --strictPort',
      url: 'http://127.0.0.1:5190/login',
      reuseExistingServer: false,
      env: { VITE_API_URL: 'http://127.0.0.1:3188' },
    },
  ],
});
