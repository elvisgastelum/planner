import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import type { AllocationCategoryResponseDto } from "@/api/generated/model"
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
  EmptyState,
  FieldShell,
  FormError,
  ResourcePageSkeleton,
  TextField,
} from "@/features/plans/plan-ui"
import {
  readText,
  toOptionalNumber,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/categories")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.categories(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  component: CategoriesPage,
})

function CategoriesPage() {
  const { planId } = Route.useParams()
  const { data: categories } = useSuspenseQuery(planQueries.categories(planId))
  const createCategoryMutation = useMutation(planMutations.createCategory())
  const [createForm, setCreateForm] = useState({
    description: "",
    key: "",
    name: "",
    percentage: "",
  })

  async function handleCreate() {
    const percentage = toOptionalNumber(createForm.percentage)

    if (percentage === undefined || percentage < 0) {
      return
    }

    await createCategoryMutation.mutateAsync({
      data: {
        description: toOptionalString(createForm.description),
        key: createForm.key.trim(),
        name: createForm.name.trim(),
        percentage,
      },
      planId,
    })

    setCreateForm({
      description: "",
      key: "",
      name: "",
      percentage: "",
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage the allocation categories used by payment items and recurring
            expenses.
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
          <CardTitle>Create category</CardTitle>
          <CardDescription>
            Categories can be selected from payment items and recurring
            expenses.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FieldShell label="Key">
            <TextField
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, key: value }))
              }
              placeholder="rent"
              value={createForm.key}
            />
          </FieldShell>
          <FieldShell label="Name">
            <TextField
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, name: value }))
              }
              placeholder="Rent"
              value={createForm.name}
            />
          </FieldShell>
          <FieldShell label="Percentage">
            <TextField
              min="0"
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, percentage: value }))
              }
              step="0.01"
              type="number"
              value={createForm.percentage}
            />
          </FieldShell>
          <FieldShell label="Description">
            <TextField
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, description: value }))
              }
              placeholder="Optional note"
              value={createForm.description}
            />
          </FieldShell>
          <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-4">
            <FormError error={createCategoryMutation.error} />
            <Button
              className="w-fit"
              disabled={
                createCategoryMutation.isPending ||
                !createForm.key.trim() ||
                !createForm.name.trim() ||
                toOptionalNumber(createForm.percentage) === undefined
              }
              onClick={() => void handleCreate()}
              type="button"
            >
              {createCategoryMutation.isPending
                ? "Creating..."
                : "Create category"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <EmptyState
          description="Create your first category to organize planned spending."
          title="No categories yet"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <CategoryCard
              category={category}
              key={category.id}
              planId={planId}
            />
          ))}
        </div>
      )}
    </main>
  )
}

function CategoryCard({
  category,
  planId,
}: {
  category: AllocationCategoryResponseDto
  planId: string
}) {
  const updateCategoryMutation = useMutation(planMutations.updateCategory())
  const deleteCategoryMutation = useMutation(planMutations.deleteCategory())
  const [form, setForm] = useState({
    description: readText(category.description),
    key: readText(category.key),
    name: readText(category.name),
    percentage: readText(category.percentage),
  })
  const isSaving = updateCategoryMutation.variables?.categoryId === category.id
  const isDeleting =
    deleteCategoryMutation.variables?.categoryId === category.id

  async function handleSave() {
    const percentage = toOptionalNumber(form.percentage)

    if (percentage === undefined || percentage < 0) {
      return
    }

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
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{category.name}</CardTitle>
        <CardDescription>
          {category.key} · {category.percentage}%
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
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
        <FormError error={updateCategoryMutation.error} />
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={
              isSaving ||
              !form.key.trim() ||
              !form.name.trim() ||
              toOptionalNumber(form.percentage) === undefined
            }
            onClick={() => void handleSave()}
            type="button"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            disabled={isDeleting}
            onClick={() =>
              void deleteCategoryMutation.mutateAsync({
                categoryId: category.id,
                planId,
              })
            }
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
