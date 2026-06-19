import { expect,test } from "./fixtures/test"
import { expectAppShell, expectNoRouteError,expectPlanShell } from "./helpers/assertions"

const routes = [
  { path: "/", expectText: /plans/i, needsPlanShell: false },
  { path: "/health", expectText: /system health/i, needsPlanShell: false },
  { path: "/plans", expectText: /plans/i, needsPlanShell: false },
  { path: "/plans/new", expectText: /create plan/i, needsPlanShell: false },
  { path: "/plans/import", expectText: /import/i, needsPlanShell: false },
  { path: "/plans/plan-e2e", expectText: /E2E Financial Plan/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/edit", expectText: /edit/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/danger", expectText: /danger/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/accounts", expectText: /accounts/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/accounts/new", expectText: /new account/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/accounts/account-checking", expectText: /Checking Account/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/categories", expectText: /categories/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/categories/new", expectText: /new category/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/categories/category-housing", expectText: /Housing/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/categories/allocations", expectText: /allocations/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/income", expectText: /income/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/income/schedule", expectText: /schedule/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/income/payments", expectText: /payments/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/income/payments/new", expectText: /New Income Payment/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/income/payments/income-payment-january", expectText: /January/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/payment-periods", expectText: /budget periods/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/payment-periods/new", expectText: /New budget period/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/payment-periods/period-january", expectText: /Budget period/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/payment-periods/period-january/edit", expectText: /edit/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/payment-periods/period-january/items/new", expectText: /New budget item/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/payment-periods/period-january/items/item-rent", expectText: /Rent/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/payment-periods/period-january/items/item-rent/complete", expectText: /Fulfill Budget Item/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/recurring-expenses", expectText: /recurring items/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/recurring-expenses/new", expectText: /new recurring/i, needsPlanShell: true },
  { path: "/plans/plan-e2e/recurring-expenses/recurring-rent", expectText: /Recurring Item/i, needsPlanShell: true },
]

test.describe("Route Coverage", () => {
  for (const route of routes) {
    test(`"${route.path}" loads without errors`, async ({ page }) => {
      await page.goto(route.path)
      await page.waitForLoadState("networkidle")

      if (route.needsPlanShell) {
        await expectPlanShell(page)
      } else {
        await expectAppShell(page)
      }

      await expectNoRouteError(page)

      if (route.expectText) {
        await expect(page.getByText(route.expectText).first()).toBeVisible()
      }
    })
  }
})
