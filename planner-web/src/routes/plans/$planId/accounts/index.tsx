import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Pencil, Plus } from "lucide-react"

import type { AccountResponseDto } from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import {
  EmptyState,
  ResourcePageSkeleton,
  StatusBadge,
} from "@/features/plans/plan-ui"

export const Route = createFileRoute("/plans/$planId/accounts/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.accounts(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  component: AccountsListPage,
})

function AccountsListPage() {
  const { planId } = Route.useParams()
  const { data: accounts } = useSuspenseQuery(planQueries.accounts(planId))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Read-only account list. Open one to edit its details.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId">
              <ArrowLeft />
              Back to dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link params={{ planId }} to="/plans/$planId/accounts/new">
              <Plus />
              New account
            </Link>
          </Button>
        </div>
      </header>

      {accounts.length === 0 ? (
        <EmptyState
          description="Create your first account to start linking expenses and payment items."
          title="No accounts yet"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((account) => (
            <AccountCard account={account} key={account.id} planId={planId} />
          ))}
        </div>
      )}
    </main>
  )
}

function AccountCard({
  account,
  planId,
}: {
  account: AccountResponseDto
  planId: string
}) {
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
      <CardContent className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{account.type}</span>
        <Button asChild variant="outline" size="sm">
          <Link
            params={{ accountId: account.id, planId }}
            to="/plans/$planId/accounts/$accountId"
          >
            <Pencil />
            Edit
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
