import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { healthQueries } from "@/features/health/data-access/health.queries"

export const Route = createFileRoute("/health")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(healthQueries.check()),
  pendingComponent: HealthPendingSkeleton,
  errorComponent: ({ error, reset }) => (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <p className="text-sm font-medium text-destructive">Health check</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={reset}>Retry</Button>
        </CardContent>
      </Card>
    </main>
  ),
  component: HealthPage,
})

function HealthPage() {
  const healthQuery = useSuspenseQuery(healthQueries.check())

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">System health</h1>
        <p className="text-sm text-muted-foreground">
          Check whether the API and its dependencies are reachable.
        </p>
      </div>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">API status</p>
              {healthQuery.isError ? (
                <p className="mt-1 text-xl font-semibold text-destructive">
                  Unavailable
                </p>
              ) : (
                <p className="mt-1 text-xl font-semibold text-green-600">
                  {healthQuery.data.status}
                </p>
              )}
            </div>
            <Button onClick={() => void healthQuery.refetch()}>
              {healthQuery.isRefetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          {healthQuery.isError ? (
            <p className="mt-4 text-sm text-destructive">
              {healthQuery.error.message}
            </p>
          ) : null}
          {healthQuery.data ? (
            <pre className="mt-4 overflow-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
              {JSON.stringify(healthQuery.data.details, null, 2)}
            </pre>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}

function HealthPendingSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <Card>
        <CardHeader className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-28" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </main>
  )
}
