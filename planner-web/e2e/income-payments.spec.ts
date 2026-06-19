import { expect, test } from "./fixtures/test"
import { expectNoRouteError, expectPlanShell } from "./helpers/assertions"

test.describe("Income payments", () => {
  test("income page loads with current backend-shaped response", async ({
    page,
  }) => {
    await page.goto("/plans/plan-e2e/income")
    await page.waitForLoadState("networkidle")

    await expectPlanShell(page)
    await expectNoRouteError(page)

    await expect(page.getByText(/income/i).first()).toBeVisible()
  })
})
