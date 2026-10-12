import { defineConfig } from '@playwright/test';
const base = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  use: {
    baseURL: `http://127.0.0.1:4321${base}`,
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    } : {},
  },
  projects: [
    { name: 'desktop-dark', use: { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' } },
    { name: 'mobile-light', use: { viewport: { width: 390, height: 844 }, colorScheme: 'light', isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --ignore-lock', url: `http://127.0.0.1:4321${base}`, reuseExistingServer: !process.env.CI },
});
