import { defineConfig, devices } from "@playwright/test";
import os from "os";

const continuousIntegrationRetryLimit = 2;

export default defineConfig({
  forbidOnly: Boolean(process.env["CI"]),
  fullyParallel: true,
  projects: [
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
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
