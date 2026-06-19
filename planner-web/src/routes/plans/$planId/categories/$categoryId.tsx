import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Save } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import type { CategoryResponseDto } from "@/api/generated/model"
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
import { planMutations } from "@/features/plans/data-access/plan.mutations"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import {
  FieldShell,
  FormError,
  ResourcePageSkeleton,
  TextField,
} from "@/features/plans/plan-ui"
import { readText } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/categories/$categoryId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.categories(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  component: EditCategoryPage,
})

function EditCategoryPage() {
  const { categoryId, planId } = Route.useParams()
  const { data: categories } = useSuspenseQuery(planQueries.categories(planId))
  const category = useMemo(
    () => categories.find((item) => item.id === categoryId),
    [categories, categoryId]
  )

  if (!category) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Category not found</CardTitle>
            <CardDescription>
              The selected category no longer exists or was not loaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" size="sm">
              <Link params={{ planId }} to="/plans/$planId/categories">
                <ArrowLeft />
                Back to categories
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <EditCategoryForm key={category.id} category={category} planId={planId} />
  )
}

function EditCategoryForm({
  category,
  planId,
}: {
  category: CategoryResponseDto
  planId: string
}) {
  const navigate = useNavigate()
  const updateCategoryMutation = useMutation(planMutations.updateCategory())
  const archiveCategoryMutation = useMutation(planMutations.archiveCategory())
  const [form, setForm] = useState(() => mapCategoryToFormState(category))

  async function handleSave() {
    try {
      await updateCategoryMutation.mutateAsync({
        categoryId: category.id,
        data: {
          code: form.code.trim(),
          description: form.description.trim() ? form.description : null,
          idealPercentageBps: form.idealPercentageBps,
          name: form.name.trim(),
        },
        planId,
      })
      toast.success("Category updated.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update category."
      )
    }
  }

  async function handleArchive() {
    try {
      await archiveCategoryMutation.mutateAsync({
        categoryId: category.id,
        planId,
      })
      toast.success("Category archived.")
      await navigate({ to: "/plans/$planId/categories", params: { planId } })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to archive category."
      )
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit category</h1>
          <p className="text-sm text-muted-foreground">
            Update category metadata or delete it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId/categories">
              <ArrowLeft />
              Back to categories
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link
              params={{ planId }}
              to="/plans/$planId/categories/allocations"
            >
              Adjust allocations
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{category.name}</CardTitle>
          <CardDescription>
            {category.code} · Ideal: {category.idealPercentageBps / 100}%
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FieldShell label="Code">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, code: value }))
              }
              value={form.code}
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
          <FieldShell label="Ideal percentage (%)">
            <TextField
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  idealPercentageBps: value
                    ? Math.round(Number(value) * 100)
                    : 0,
                }))
              }
              value={
                form.idealPercentageBps
                  ? (form.idealPercentageBps / 100).toString()
                  : ""
              }
              type="number"
              min="0"
              max="100"
            />
          </FieldShell>
          <FieldShell label="Description">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, description: value }))
              }
              value={form.description}
            />
          </FieldShell>
          <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-4">
            <FormError
              error={
                updateCategoryMutation.error ?? archiveCategoryMutation.error
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={
                  updateCategoryMutation.isPending ||
                  !form.code.trim() ||
                  !form.name.trim()
                }
                onClick={() => void handleSave()}
                type="button"
              >
                <Save />
                {updateCategoryMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={archiveCategoryMutation.isPending}
                    type="button"
                    variant="destructive"
                  >
                    Archive category
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive category?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will archive the category. You can restore it later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={archiveCategoryMutation.isPending}
                      onClick={() => void handleArchive()}
                    >
                      {archiveCategoryMutation.isPending
                        ? "Archiving..."
                        : "Archive"}
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

function mapCategoryToFormState(category: CategoryResponseDto | undefined) {
  return {
    code: readText(category?.code),
    description: readText(category?.description),
    idealPercentageBps: category?.idealPercentageBps ?? 0,
    name: readText(category?.name),
  }
}
