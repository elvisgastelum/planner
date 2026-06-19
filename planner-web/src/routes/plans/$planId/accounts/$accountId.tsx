import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Save } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  type AccountResponseDto,
  type UpdateAccountDto,
  UpdateAccountDtoAccountType,
} from "@/api/generated/model"
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
  StatusBadge,
  TextField,
} from "@/features/plans/plan-ui"
import { readText, toOptionalString } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/accounts/$accountId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.accounts(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  component: EditAccountPage,
})

const updateAccountTypes = Object.values(
  UpdateAccountDtoAccountType
) as readonly UpdateAccountDtoAccountType[]
type UpdateAccountType = UpdateAccountDtoAccountType

function EditAccountPage() {
  const { accountId, planId } = Route.useParams()
  const { data: accounts } = useSuspenseQuery(planQueries.accounts(planId))
  const account = useMemo(
    () => accounts.find((item) => item.id === accountId),
    [accountId, accounts]
  )

  if (!account) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Account not found</CardTitle>
            <CardDescription>
              The selected account no longer exists or was not loaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" size="sm">
              <Link params={{ planId }} to="/plans/$planId/accounts">
                <ArrowLeft />
                Back to accounts
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return <EditAccountForm key={account.id} account={account} planId={planId} />
}

function EditAccountForm({
  account,
  planId,
}: {
  account: AccountResponseDto
  planId: string
}) {
  const updateAccountMutation = useMutation(planMutations.updateAccount())
  const [form, setForm] = useState<{
    externalId: string
    name: string
    accountType: UpdateAccountType
    currency: string
  }>(() => mapAccountToFormState(account))

  async function handleSave() {
    try {
      const data = {
        externalId: toOptionalString(form.externalId),
        name: toOptionalString(form.name),
        accountType: form.accountType,
        currency: form.currency || undefined,
      } satisfies UpdateAccountDto

      await updateAccountMutation.mutateAsync({
        accountId: account.id,
        data,
        planId,
      })
      toast.success("Account updated.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update account."
      )
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Edit account</h1>
            <StatusBadge value={account.accountType} />
          </div>
          <p className="text-sm text-muted-foreground">
            Change the account fields or delete it from here.
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
          <CardTitle>{account.name}</CardTitle>
          <CardDescription>{account.externalId}</CardDescription>
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
                  accountType: value as UpdateAccountType,
                }))
              }
              value={form.accountType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {updateAccountTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FieldShell label="Currency">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, currency: value }))
              }
              placeholder="MXN"
              value={form.currency}
            />
          </FieldShell>
          <div className="flex flex-col gap-3 md:col-span-3">
            <FormError error={updateAccountMutation.error} />
            <Button
              disabled={
                updateAccountMutation.isPending ||
                !form.externalId.trim() ||
                !form.name.trim()
              }
              onClick={() => void handleSave()}
              type="button"
            >
              <Save />
              {updateAccountMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

function mapAccountToFormState(account: AccountResponseDto | undefined) {
  const fallbackType: UpdateAccountType = "checking"
  const accountType = account?.accountType ?? fallbackType
  const validTypes = new Set(updateAccountTypes)
  return {
    externalId: readText(account?.externalId),
    name: readText(account?.name),
    accountType: validTypes.has(accountType as UpdateAccountType)
      ? (accountType as UpdateAccountType)
      : fallbackType,
    currency: account?.currency ?? "MXN",
  }
}
