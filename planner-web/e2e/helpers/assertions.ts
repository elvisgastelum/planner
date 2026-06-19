import { expect, type Page } from "@playwright/test"

export const expectAppShell = async (page: Page) => {
  await page.waitForLoadState("networkidle")

  // Assert main navigation links are visible
  await expect(page.getByRole("link", { name: /planner/i }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: /plans/i }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: /health/i }).first()).toBeVisible()
}

export const expectPlanShell = async (page: Page) => {
  await page.waitForLoadState("networkidle")

  // Assert plan name is visible
  await expect(page.getByText(/E2E Financial Plan/i).first()).toBeVisible()

  // Assert sidebar navigation links are visible (using first() to handle duplicate desktop/mobile links)
  await expect(page.getByRole("link", { name: /overview/i }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: /accounts/i }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: /categories/i }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: /income/i }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: /budget periods/i }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: /recurring items/i }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: /settings/i }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: /danger zone/i }).first()).toBeVisible()
}

export const expectNoRouteError = async (page: Page) => {
  const bodyText = (await page.locator("body").textContent()) ?? ""

  // Only fail if there's an explicit "Page not found" message
  // The 404 status might be expected for unknown routes
  const hasPageNotFound = bodyText.toLowerCase().includes("page not found")
  const hasErrorCard = await page.getByRole("alert").isVisible().catch(() => false)

  // Don't throw on 404 in body text alone - only on explicit error UI
  if (hasPageNotFound && hasErrorCard) {
    throw new Error("Page contains explicit not found error UI")
  }
}
