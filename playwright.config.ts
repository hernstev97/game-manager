import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: "line",
  timeout: 30_000,
  expect: { timeout: 8_000, toHaveScreenshot: { animations: "disabled" } },
  use: {
    baseURL,
    colorScheme: "light",
    serviceWorkers: "allow",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "mobile-320",
      grep: /@viewport|@mobile/,
      use: { viewport: { width: 320, height: 700 } },
    },
    {
      name: "mobile-390",
      grep: /@viewport|@mobile/,
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: "tablet-768",
      grep: /@viewport/,
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: "desktop-1280",
      grep: /@viewport|@desktop/,
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],
});
