import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import type { CreateAccountDto } from "@/api/generated/model"
import { CreateAccountDtoType } from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { planMutations } from "@/features/plans/data-access/plan.mutations"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import {
  FieldShell,
  FormError,
  ResourcePageSkeleton,
  TextField,
} from "@/features/plans/plan-ui"

export const Route = createFileRoute("/plans/$planId/accounts/new")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.accounts(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  component: NewAccountPage,
})

const accountTypes = Object.values(CreateAccountDtoType)
type AccountType = (typeof accountTypes)[number]

function NewAccountPage() {
  const navigate = useNavigate()
  const { planId } = Route.useParams()
  useSuspenseQuery(planQueries.accounts(planId))
  const createAccountMutation = useMutation(planMutations.createAccount())
  const [form, setForm] = useState<{
    externalId: string
    name: string
    type: AccountType
    balance: string
    currency: string
  }>({
    externalId: "",
    name: "",
    type: CreateAccountDtoType.debit,
    balance: "",
    currency: "MXN",
  })

  async function handleCreate() {
    try {
      const data = {
        externalId: form.externalId.trim(),
        name: form.name.trim(),
        type: form.type,
        balance: form.balance ? Number(form.balance) : undefined,
        currency: form.currency || undefined,
      } satisfies CreateAccountDto

      await createAccountMutation.mutateAsync({
        planId,
        data,
      })

      toast.success("Account created.")
      await navigate({ to: "/plans/$planId/accounts", params: { planId } })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create account."
      )
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">New account</h1>
          <p className="text-sm text-muted-foreground">
            Create an account record for the plan.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/accounts">
            <ArrowLeft />
            Back to accounts
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>
            Use a stable external ID when possible.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FieldShell label="External ID">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, externalId: value }))
              }
              value={form.externalId}
            />
          </FieldShell>
          <FieldShell label="Name">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, name: value }))
              }
              value={form.name}
            />
          </FieldShell>
          <FieldShell label="Type">
            <Select
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  type: value as AccountType,
                }))
              }
              value={form.type}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FieldShell label="Initial balance">
            <TextField
              name="balance"
              onChange={(value) =>
                setForm((current) => ({ ...current, balance: value }))
              }
              placeholder="0.00"
              type="number"
              min="0"
              step="0.01"
              value={form.balance}
            />
          </FieldShell>
          <FieldShell label="Currency">
            <TextField
              name="currency"
              onChange={(value) =>
                setForm((current) => ({ ...current, currency: value }))
              }
              placeholder="MXN"
              value={form.currency}
            />
          </FieldShell>
          <div className="flex flex-col gap-3 md:col-span-3">
            <FormError error={createAccountMutation.error} />
            <Button
              className="w-fit"
              disabled={
                createAccountMutation.isPending ||
                !form.externalId.trim() ||
                !form.name.trim()
              }
              onClick={() => void handleCreate()}
              type="button"
            >
              <Plus />
              {createAccountMutation.isPending
                ? "Creating..."
                : "Create account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
