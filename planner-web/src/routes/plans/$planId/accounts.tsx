import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import {
  type AccountResponseDto,
  CreateAccountDtoType,
  type UpdateAccountDto,
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
  EmptyState,
  FieldShell,
  FormError,
  ResourcePageSkeleton,
  StatusBadge,
  TextField,
} from "@/features/plans/plan-ui"
import { readText, toOptionalString } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/accounts")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.accounts(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  component: AccountsPage,
})

const accountTypes = Object.values(CreateAccountDtoType)
type AccountType = (typeof accountTypes)[number]

function AccountsPage() {
  const { planId } = Route.useParams()
  const { data: accounts } = useSuspenseQuery(planQueries.accounts(planId))
  const createAccountMutation = useMutation(planMutations.createAccount())
  const updateAccountMutation = useMutation(planMutations.updateAccount())
  const deleteAccountMutation = useMutation(planMutations.deleteAccount())
  const [createForm, setCreateForm] = useState<{
    externalId: string
    name: string
    type: AccountType
  }>({
    externalId: "",
    name: "",
    type: CreateAccountDtoType.debit,
  })

  async function handleCreate() {
    await createAccountMutation.mutateAsync({
      planId,
      data: {
        externalId: createForm.externalId,
        name: createForm.name,
        type: createForm.type,
      },
    })

    setCreateForm({
      externalId: "",
      name: "",
      type: CreateAccountDtoType.debit,
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Add the accounts referenced by income, recurring expenses, and
            planned items.
          </p>
        </div>
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          params={{ planId }}
          to="/plans/$planId"
        >
          Back to plan
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Use stable identifiers from the API domain when possible.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FieldShell label="External ID">
            <TextField
              placeholder="checking-main"
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  externalId: value,
                }))
              }
              value={createForm.externalId}
            />
          </FieldShell>
          <FieldShell label="Name">
            <TextField
              placeholder="Main checking"
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
              value={createForm.name}
            />
          </FieldShell>
          <FieldShell label="Type">
            <Select
              onValueChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  type: value as (typeof accountTypes)[number],
                }))
              }
              value={createForm.type}
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
            <FormError error={createAccountMutation.error} />
            <Button
              className="w-fit"
              disabled={
                createAccountMutation.isPending ||
                !createForm.externalId.trim() ||
                !createForm.name.trim()
              }
              onClick={() => void handleCreate()}
              type="button"
            >
              {createAccountMutation.isPending
                ? "Creating..."
                : "Create account"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {accounts.length === 0 ? (
        <EmptyState
          description="Create your first account to start linking expenses and payment items."
          title="No accounts yet"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((account) => (
            <AccountCard
              account={account}
              deletePendingId={
                deleteAccountMutation.variables?.accountId ?? null
              }
              key={account.id}
              onDelete={() =>
                void deleteAccountMutation.mutateAsync({
                  accountId: account.id,
                  planId,
                })
              }
              onSave={(data) =>
                void updateAccountMutation.mutateAsync({
                  accountId: account.id,
                  data,
                  planId,
                })
              }
              saveError={updateAccountMutation.error}
              savePendingId={updateAccountMutation.variables?.accountId ?? null}
            />
          ))}
        </div>
      )}
    </main>
  )
}

function AccountCard({
  account,
  deletePendingId,
  onDelete,
  onSave,
  saveError,
  savePendingId,
}: {
  account: AccountResponseDto
  deletePendingId: string | null
  onDelete: () => void
  onSave: (data: UpdateAccountDto) => void
  saveError: Error | null
  savePendingId: string | null
}) {
  const [form, setForm] = useState({
    externalId: readText(account.externalId),
    name: readText(account.name),
    type: account.type,
  })
  const isSaving = savePendingId === account.id
  const isDeleting = deletePendingId === account.id

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{account.name}</CardTitle>
            <CardDescription>{account.externalId}</CardDescription>
          </div>
          <StatusBadge value={account.type} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <FieldShell label="External ID">
          <TextField
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                externalId: value,
              }))
            }
            value={form.externalId}
          />
        </FieldShell>
        <FieldShell label="Name">
          <TextField
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                name: value,
              }))
            }
            value={form.name}
          />
        </FieldShell>
        <FieldShell label="Type">
          <Select
            onValueChange={(value) =>
              setForm((current) => ({ ...current, type: value as AccountType }))
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
        <FormError error={saveError} />
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isSaving || !form.name.trim() || !form.externalId.trim()}
            onClick={() =>
              onSave({
                externalId: toOptionalString(form.externalId),
                name: toOptionalString(form.name),
                type: form.type,
              })
            }
            type="button"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            disabled={isDeleting}
            onClick={onDelete}
            type="button"
            variant="destructive"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
