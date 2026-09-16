import { defineConfig, devices } from "@playwright/test";
import { loadE2EEnvironment } from "./e2e/helpers/environment";

const { target, baseURL, apiURL } = loadE2EEnvironment();

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: baseURL.origin,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Own a fresh local frontend: never reuse a dev server with unknown API env.
  // Laravel remains manually managed; Phase 1 performs no seeding or DB reset.
  webServer: target === "local" ? {
    command: `node node_modules/next/dist/bin/next dev --webpack --hostname ${baseURL.hostname.replace(/[\[\]]/g, "")} --port ${baseURL.port || "80"}`,
    url: baseURL.origin,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_URL: `${apiURL.origin}/api`,
      NEXT_PUBLIC_API_BASE_URL: `${apiURL.origin}/api`,
      BACKEND_URL: apiURL.origin,
    },
  } : undefined,
});
