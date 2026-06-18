import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Pencil, Plus } from "lucide-react"

import { ResourceCard } from "@/components/resource-card"
import { ResourceList } from "@/components/resource-list"
import { Button } from "@/components/ui/button"
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
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId">
              <ArrowLeft />
              Back to dashboard
            </Link>
          </Button>
          <Button asChild size="sm">
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
        <ResourceList>
          {accounts.map((account) => (
            <ResourceCard
              key={account.id}
              title={account.name}
              description={account.externalId}
              badge={<StatusBadge value={account.accountType} />}
               metadata={[
                 {
                   label: "Type",
                   value: account.accountType,
                 },
                 {
                   label: "Currency",
                   value: account.currency ?? "MXN",
                 },
               ]}
              actions={
                <Button asChild variant="outline" size="sm">
                  <Link
                    params={{ accountId: account.id, planId }}
                    to="/plans/$planId/accounts/$accountId"
                  >
                    <Pencil />
                    Edit
                  </Link>
                </Button>
              }
            />
          ))}
        </ResourceList>
      )}
    </main>
  )
}
