import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { healthQueries } from "@/features/health/data-access/health.queries"

export function App() {
  const healthQuery = useQuery(healthQueries.check())

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <h2 className="font-medium">API health</h2>
          {healthQuery.isPending ? (
            <p className="text-muted-foreground">Checking API...</p>
          ) : healthQuery.isError ? (
            <p className="text-destructive">
              API unavailable: {healthQuery.error.message || "Unknown error"}
            </p>
          ) : (
            <p>
              Status:&nbsp;
              <span className="font-medium">{healthQuery.data.status}</span>
            </p>
          )}
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}

export default App
