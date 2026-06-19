import { expect,test } from "./fixtures/test"
import { expectAppShell } from "./helpers/assertions"

test.describe("App Shell", () => {
  test("root redirects to plans", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    expect(page.url()).toContain("/plans")
  })

  test("unknown route shows Page not found", async ({ page }) => {
    await page.goto("/unknown-route")
    await page.waitForLoadState("networkidle")
    await expect(page.getByText(/page not found/i)).toBeVisible()
  })

  test("header shows Planner link", async ({ page }) => {
    await page.goto("/plans")
    await page.waitForLoadState("networkidle")
    await expect(page.getByRole("link", { name: /planner/i })).toBeVisible()
  })

  test("sidebar shows Plans and Health links", async ({ page }) => {
    await page.goto("/plans")
    await page.waitForLoadState("networkidle")
    await expectAppShell(page)
  })
})
