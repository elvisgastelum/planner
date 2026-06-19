import { expect,test } from "./fixtures/test"
import { expectAppShell, expectNoRouteError } from "./helpers/assertions"

test.describe("Health Route", () => {
  test("loads System health page", async ({ page }) => {
    await page.goto("/health")
    await page.waitForLoadState("networkidle")

    await expectAppShell(page)
    await expectNoRouteError(page)

    await expect(page.getByText(/system health/i)).toBeVisible()
    await expect(page.getByText("API status")).toBeVisible()
  })
})
