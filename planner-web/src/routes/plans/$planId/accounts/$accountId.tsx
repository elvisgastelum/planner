import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  type AccountResponseDto,
  CreateAccountDtoType,
  type UpdateAccountDto,
} from "@/api/generated/model"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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

const accountTypes = Object.values(CreateAccountDtoType)
type AccountType = (typeof accountTypes)[number]

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
  const navigate = useNavigate()
  const updateAccountMutation = useMutation(planMutations.updateAccount())
  const deleteAccountMutation = useMutation(planMutations.deleteAccount())
  const [form, setForm] = useState<{
    externalId: string
    name: string
    type: AccountType
  }>(() => mapAccountToFormState(account))

  async function handleSave() {
    try {
      await updateAccountMutation.mutateAsync({
        accountId: account.id,
        data: {
          externalId: toOptionalString(form.externalId),
          name: toOptionalString(form.name),
          type: form.type,
        } satisfies UpdateAccountDto,
        planId,
      })
      toast.success("Account updated.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update account."
      )
    }
  }

  async function handleDelete() {
    try {
      await deleteAccountMutation.mutateAsync({ accountId: account.id, planId })
      toast.success("Account deleted.")
      await navigate({ to: "/plans/$planId/accounts", params: { planId } })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account."
      )
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Edit account</h1>
            <StatusBadge value={account.type} />
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
          <div className="flex flex-col gap-3 md:col-span-3">
            <FormError
              error={deleteAccountMutation.error ?? updateAccountMutation.error}
            />
            <div className="flex flex-wrap gap-2">
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={deleteAccountMutation.isPending}
                    type="button"
                    variant="destructive"
                  >
                    <Trash2 />
                    Delete account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the account and cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={deleteAccountMutation.isPending}
                      onClick={() => void handleDelete()}
                    >
                      {deleteAccountMutation.isPending
                        ? "Deleting..."
                        : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

function mapAccountToFormState(account: AccountResponseDto | undefined) {
  return {
    externalId: readText(account?.externalId),
    name: readText(account?.name),
    type: account?.type ?? CreateAccountDtoType.debit,
  }
}
