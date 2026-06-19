import { zodResolver } from "@hookform/resolvers/zod"
import { useSuspenseQuery } from "@tanstack/react-query"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { planMutations } from "@/features/plans/data-access/plan.mutations"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { formatCents } from "@/features/plans/plan-ui.utils"

const fulfillItemSchema = z.object({
  transactionId: z.string().min(1, "Transaction is required"),
  allocatedAmountCents: z.string().min(1, "Allocated amount is required"),
})

type FulfillItemForm = z.infer<typeof fulfillItemSchema>

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId/items/$itemId/complete"
)({
  pendingComponent: () => <div>Loading...</div>,
  component: CompleteItemPage,
})

function CompleteItemPage() {
  const { itemId, periodId, planId } = Route.useParams()
  const navigate = useNavigate()

  const { data: item } = useSuspenseQuery(
    planQueries.budgetItem(planId, periodId, itemId)
  )
  const { data: planData } = useSuspenseQuery(planQueries.detail(planId))
  const { data: accounts } = useSuspenseQuery(planQueries.accounts(planId))

  const fulfillMutation = useMutation(planMutations.fulfillBudgetItem())

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FulfillItemForm>({
    resolver: zodResolver(fulfillItemSchema),
  })

  const onSubmit = async (data: FulfillItemForm) => {
    try {
      await fulfillMutation.mutateAsync({
        planId,
        periodId,
        itemId,
        data: {
          transactionId: data.transactionId,
          allocatedAmountCents: parseInt(data.allocatedAmountCents),
        },
      })

      await navigate({
        to: "/plans/$planId/payment-periods/$periodId/items/$itemId",
        params: { planId, periodId, itemId },
      })
    } catch (error) {
      console.error("Failed to fulfill item:", error)
    }
  }

  const baseCurrency = planData.baseCurrency ?? "MXN"

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link
            params={{ itemId, periodId, planId }}
            to="/plans/$planId/payment-periods/$periodId/items/$itemId"
          >
            <ArrowLeft />
            Back to item
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Fulfill Budget Item</CardTitle>
          <CardDescription>
            Link an actual transaction to this budget item to mark it as
            fulfilled. This allocates the transaction amount to the budget item.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Budget Item:</span>
              <span className="text-sm">{item.concept}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Planned Amount:</span>
              <span className="text-sm">
                {formatCents(item.plannedAmountCents, baseCurrency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Current Status:</span>
              <span className="text-sm">{item.status}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction</Label>
              <Select
                value={watch("transactionId")}
                onValueChange={(value) => setValue("transactionId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a transaction" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} (Account)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.transactionId && (
                <p className="text-sm text-destructive">
                  {errors.transactionId.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Note: This is a simplified version. In production, you would
                select from actual transactions.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocatedAmountCents">
                Allocated Amount (in cents)
              </Label>
              <Input
                type="number"
                placeholder={`Planned: ${item.plannedAmountCents}`}
                {...register("allocatedAmountCents")}
              />
              {errors.allocatedAmountCents && (
                <p className="text-sm text-destructive">
                  {errors.allocatedAmountCents.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Amount from the transaction to allocate to this budget item.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || fulfillMutation.isPending}
              >
                {isSubmitting || fulfillMutation.isPending
                  ? "Fulfilling..."
                  : "Fulfill Item"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate({
                    to: "/plans/$planId/payment-periods/$periodId/items/$itemId",
                    params: { planId, periodId, itemId },
                  })
                }
              >
                Cancel
              </Button>
            </div>

            {fulfillMutation.isError && (
              <p className="text-sm text-destructive">
                Failed to fulfill item. Please try again.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
