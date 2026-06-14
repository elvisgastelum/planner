import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import type { AllocationCategoryResponseDto } from "@/api/generated/model"
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
import { readText, toOptionalNumber } from "@/features/plans/plan-ui.utils"

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
  category: AllocationCategoryResponseDto
  planId: string
}) {
  const navigate = useNavigate()
  const updateCategoryMutation = useMutation(planMutations.updateCategory())
  const deleteCategoryMutation = useMutation(planMutations.deleteCategory())
  const [form, setForm] = useState(() => mapCategoryToFormState(category))

  async function handleSave() {
    const percentage = toOptionalNumber(form.percentage)

    if (percentage === undefined || percentage < 0 || percentage > 100) {
      toast.error("Percentage must be between 0 and 100.")
      return
    }

    try {
      await updateCategoryMutation.mutateAsync({
        categoryId: category.id,
        data: {
          description: form.description.trim() ? form.description : null,
          key: form.key.trim(),
          name: form.name.trim(),
          percentage,
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

  async function handleDelete() {
    try {
      await deleteCategoryMutation.mutateAsync({
        categoryId: category.id,
        planId,
      })
      toast.success("Category deleted.")
      await navigate({ to: "/plans/$planId/categories", params: { planId } })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category."
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
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/categories">
            <ArrowLeft />
            Back to categories
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{category.name}</CardTitle>
          <CardDescription>
            {category.key} · {category.percentage}%
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FieldShell label="Key">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, key: value }))
              }
              value={form.key}
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
              value={form.description}
            />
          </FieldShell>
          <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-4">
            <FormError
              error={
                updateCategoryMutation.error ?? deleteCategoryMutation.error
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={
                  updateCategoryMutation.isPending ||
                  !form.key.trim() ||
                  !form.name.trim() ||
                  toOptionalNumber(form.percentage) === undefined
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
                    disabled={deleteCategoryMutation.isPending}
                    type="button"
                    variant="destructive"
                  >
                    <Trash2 />
                    Delete category
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete category?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the category and cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={deleteCategoryMutation.isPending}
                      onClick={() => void handleDelete()}
                    >
                      {deleteCategoryMutation.isPending
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

function mapCategoryToFormState(
  category: AllocationCategoryResponseDto | undefined
) {
  return {
    description: readText(category?.description),
    key: readText(category?.key),
    name: readText(category?.name),
    percentage: readText(category?.percentage),
  }
}
