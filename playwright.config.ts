import { defineConfig, devices } from "@playwright/test";
import os from "os";

const continuousIntegrationRetryLimit = 2;
const ignoreScreenshotTests = /.*.screenshots.spec.ts/u;

export default defineConfig({
  forbidOnly: Boolean(process.env["CI"]),
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testIgnore: ignoreScreenshotTests,
      use: { browserName: "firefox" },
    },
    {
      name: "webkit",
      testIgnore: ignoreScreenshotTests,
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "Mobile Safari",
      testIgnore: ignoreScreenshotTests,
      use: { ...devices["iPhone 12"] },
    },
  ],
  reporter: "html",
  retries: process.env["CI"] ? continuousIntegrationRetryLimit : 0,
  testDir: "./tests-e2e",
  use: {
    baseURL: "http://localhost:1234",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm start",
    reuseExistingServer: !process.env["CI"],
    url: "http://localhost:1234",
  },
  workers: process.env["CI"] ? 1 : os.cpus().length,
});
