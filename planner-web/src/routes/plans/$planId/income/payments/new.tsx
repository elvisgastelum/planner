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
import { DatePicker } from "@/components/ui/date-picker"
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

const createPaymentSchema = z.object({
  incomeSourceId: z.string().min(1, "Income source is required"),
  incomeScheduleId: z.string().optional(),
  paidOn: z.string().min(1, "Payment date is required"),
  paymentNumberInMonth: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  externalSource: z.string().optional(),
  externalId: z.string().optional(),
})

type CreatePaymentForm = z.infer<typeof createPaymentSchema>

export const Route = createFileRoute("/plans/$planId/income/payments/new")({
  pendingComponent: () => <div>Loading...</div>,
  component: NewIncomePaymentPage,
})

function NewIncomePaymentPage() {
  const { planId } = Route.useParams()
  const navigate = useNavigate()

  const { data: sourcesData } = useSuspenseQuery(
    planQueries.incomeSources(planId)
  )

  const createMutation = useMutation(planMutations.createIncomePayment())

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreatePaymentForm>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      status: "received",
    },
  })

  const onSubmit = async (data: CreatePaymentForm) => {
    try {
      await createMutation.mutateAsync({
        planId,
        data: {
          incomeSourceId: data.incomeSourceId,
          incomeScheduleId: data.incomeScheduleId || undefined,
          paidOn: data.paidOn,
          paymentNumberInMonth: data.paymentNumberInMonth
            ? parseInt(data.paymentNumberInMonth)
            : undefined,
          status: data.status as "received" | "projected" | "cancelled",
          externalSource: data.externalSource || undefined,
          externalId: data.externalId || undefined,
        },
      })

      await navigate({
        to: "/plans/$planId/income/payments",
        params: { planId },
      })
    } catch (error) {
      console.error("Failed to create payment:", error)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">New Income Payment</h1>
          <p className="text-sm text-muted-foreground">
            Create a new income payment.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/income/payments">
            <ArrowLeft />
            Back to payments
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Create payment</CardTitle>
          <CardDescription>Fill in the payment details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="incomeSourceId">Income Source</Label>
              <Select
                value={watch("incomeSourceId")}
                onValueChange={(value) => setValue("incomeSourceId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select income source" />
                </SelectTrigger>
                <SelectContent>
                  {sourcesData.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.incomeSourceId && (
                <p className="text-sm text-destructive">
                  {errors.incomeSourceId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidOn">Payment Date</Label>
              <DatePicker
                onChange={(value) => setValue("paidOn", value)}
                required
                value={watch("paidOn")}
              />
              {errors.paidOn && (
                <p className="text-sm text-destructive">
                  {errors.paidOn.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="projected">Projected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentNumberInMonth">
                Payment Number in Month (optional)
              </Label>
              <Input
                type="number"
                placeholder="e.g. 1 for first payment"
                {...register("paymentNumberInMonth")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalSource">External Source (optional)</Label>
              <Input
                placeholder="e.g. bank_api"
                {...register("externalSource")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalId">External ID (optional)</Label>
              <Input placeholder="e.g. txn_12345" {...register("externalId")} />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
              >
                {isSubmitting || createMutation.isPending
                  ? "Creating..."
                  : "Create Payment"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate({
                    to: "/plans/$planId/income/payments",
                    params: { planId },
                  })
                }
              >
                Cancel
              </Button>
            </div>

            {createMutation.isError && (
              <p className="text-sm text-destructive">
                Failed to create payment. Please try again.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
