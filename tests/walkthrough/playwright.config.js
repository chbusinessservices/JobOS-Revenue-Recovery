// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://revenue-recovery-31.emergent.host';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 180 * 1000,
  expect: { timeout: 15 * 1000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: './artifacts',
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    // 1080p-quality video recording
    video: {
      mode: 'on',
      size: { width: 1920, height: 1080 },
    },
    trace: 'off',
    screenshot: 'off',
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
