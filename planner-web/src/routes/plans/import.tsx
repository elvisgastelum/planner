import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const Route = createFileRoute("/plans/import")({
  component: ImportRemovedPage,
})

function ImportRemovedPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/plans">
            <ArrowLeft />
            Back to plans
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Import JSON</CardTitle>
          <CardDescription>
            JSON import has been removed from this application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The JSON import feature is no longer available. You can create a new
            financial plan manually by clicking "Create plan" on the plans page.
          </p>
          <Button asChild>
            <Link to="/plans/new">Create new plan</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
