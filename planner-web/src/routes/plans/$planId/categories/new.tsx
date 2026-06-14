import { useMutation } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { planMutations } from "@/features/plans/data-access/plan.mutations"
import { FieldShell, FormError, TextField } from "@/features/plans/plan-ui"
import {
  toOptionalNumber,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/categories/new")({
  component: NewCategoryPage,
})

function NewCategoryPage() {
  const navigate = useNavigate()
  const { planId } = Route.useParams()
  const createCategoryMutation = useMutation(planMutations.createCategory())
  const [form, setForm] = useState({
    description: "",
    key: "",
    name: "",
    percentage: "",
  })

  async function handleCreate() {
    const percentage = toOptionalNumber(form.percentage)

    if (percentage === undefined || percentage < 0 || percentage > 100) {
      toast.error("Percentage must be between 0 and 100.")
      return
    }

    try {
      await createCategoryMutation.mutateAsync({
        data: {
          description: toOptionalString(form.description),
          key: form.key.trim(),
          name: form.name.trim(),
          percentage,
        },
        planId,
      })
      toast.success("Category created.")
      await navigate({ to: "/plans/$planId/categories", params: { planId } })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create category."
      )
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">New category</h1>
          <p className="text-sm text-muted-foreground">
            Create a new allocation category for the plan.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/categories">
            <ArrowLeft />
            Back to categories
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Category details</CardTitle>
          <CardDescription>
            Categories are used by payment items and recurring expenses.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FieldShell label="Key">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, key: value }))
              }
              placeholder="rent"
              value={form.key}
            />
          </FieldShell>
          <FieldShell label="Name">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, name: value }))
              }
              placeholder="Rent"
              value={form.name}
            />
          </FieldShell>
          <FieldShell label="Percentage">
            <TextField
              min="0"
              max="100"
              onChange={(value) =>
                setForm((current) => ({ ...current, percentage: value }))
              }
              step="0.01"
              type="number"
              value={form.percentage}
            />
          </FieldShell>
          <FieldShell label="Description">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, description: value }))
              }
              placeholder="Optional note"
              value={form.description}
            />
          </FieldShell>
          <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-4">
            <FormError error={createCategoryMutation.error} />
            <Button
              className="w-fit"
              disabled={
                createCategoryMutation.isPending ||
                !form.key.trim() ||
                !form.name.trim() ||
                toOptionalNumber(form.percentage) === undefined
              }
              onClick={() => void handleCreate()}
              type="button"
            >
              <Plus />
              {createCategoryMutation.isPending
                ? "Creating..."
                : "Create category"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
