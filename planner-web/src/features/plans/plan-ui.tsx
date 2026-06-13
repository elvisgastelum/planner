import type { ComponentPropsWithoutRef, ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export function FieldShell({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label: string
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function FormError({ error }: { error: Error | string | null }) {
  if (!error) {
    return null
  }

  return (
    <p className="text-sm text-destructive">
      {typeof error === "string" ? error : error.message}
    </p>
  )
}

export function TextField({
  onChange,
  value,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Input>, "onChange" | "value"> & {
  onChange: (value: string) => void
  value: string
}) {
  return (
    <Input
      {...props}
      onChange={(event) => onChange(event.currentTarget.value)}
      value={value}
    />
  )
}

export function TextAreaField({
  onChange,
  value,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Textarea>, "onChange" | "value"> & {
  onChange: (value: string) => void
  value: string
}) {
  return (
    <Textarea
      {...props}
      onChange={(event) => onChange(event.currentTarget.value)}
      value={value}
    />
  )
}

export function EmptyState({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="font-medium">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge variant="outline">{value}</Badge>
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

export function MetricGridSkeleton({
  columnsClassName = "md:grid-cols-3",
  count = 3,
}: {
  columnsClassName?: string
  count?: number
}) {
  return (
    <section className={cn("grid gap-4", columnsClassName)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-20" />
          </CardHeader>
        </Card>
      ))}
    </section>
  )
}

export function FormCardSkeleton({
  fields = 6,
  columnsClassName = "md:grid-cols-2 lg:grid-cols-3",
}: {
  fields?: number
  columnsClassName?: string
}) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-80" />
      </CardHeader>
      <CardContent className={cn("grid gap-4", columnsClassName)}>
        {Array.from({ length: fields }).map((_, index) => (
          <div className="space-y-2" key={index}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ResourceCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function PlansPageSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="h-full">
            <CardHeader className="space-y-3">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </main>
  )
}

export function PlanOverviewSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <PageHeaderSkeleton />
      <MetricGridSkeleton />
      <MetricGridSkeleton
        columnsClassName="sm:grid-cols-2 lg:grid-cols-5"
        count={5}
      />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <FormCardSkeleton fields={6} />
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export function ResourcePageSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <PageHeaderSkeleton />
      <FormCardSkeleton fields={6} />
      <ResourceCardsSkeleton />
    </main>
  )
}
