import { defineConfig, devices } from "@playwright/test"

const isCI = process.env.CI === "true"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [["html"], ["github"]]
    : [["html"], ["list"]],
  outputDir: "test-results",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  webServer: {
    command: "VITE_API_BASE_URL=http://127.0.0.1:3000 pnpm run build && VITE_API_BASE_URL=http://127.0.0.1:3000 pnpm exec vite preview --host 127.0.0.1 --port 4173",
    url: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173",
    reuseExistingServer: !isCI,
    timeout: 120000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
})
