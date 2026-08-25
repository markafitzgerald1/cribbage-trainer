import { defineConfig, devices } from "@playwright/test";
import os from "os";

const continuousIntegrationRetryLimit = 2;
const continuousIntegrationWorkerLimit = 2;
const defaultMaxLocalWorkers = 4;
const ignoreScreenshotTests = /.*\.screenshots\.spec\.ts$/u;
const isContinuousIntegration = Boolean(
  process.env["CI"] && process.env["CI"] !== "false",
);
const testTimeoutMs = 60_000;

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      // This threshold sits above the arm64-dev/amd64-CI antialiasing floor.
      // Text ghosting through a translucent modal set that floor near 635px.
      maxDiffPixels: 800,
    },
  },
  forbidOnly: isContinuousIntegration,
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
  reporter: [["html", { open: "never" }]],
  retries: isContinuousIntegration ? continuousIntegrationRetryLimit : 0,
  testDir: "./tests-e2e",
  timeout: testTimeoutMs,
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run start:production-preview",
    // Without an ID the loader short-circuits before its consent check.
    // A "nothing was sent" assertion would then hold even if that check broke.
    // This ID is unregistered and the specs block the hosts, so nothing leaves.
    env: { VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID: "G-0000000000" },
    reuseExistingServer: !isContinuousIntegration,
    url: "http://localhost:4173/cribbage-trainer",
  },
  workers: isContinuousIntegration
    ? continuousIntegrationWorkerLimit
    : Math.min(os.cpus().length, defaultMaxLocalWorkers),
});
