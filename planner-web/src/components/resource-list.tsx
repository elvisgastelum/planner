import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type ResourceListProps = {
  children?: ReactNode
  className?: string
  columns?: "one" | "two" | "three"
}

const columnClasses: Record<
  NonNullable<ResourceListProps["columns"]>,
  string
> = {
  one: "grid-cols-1",
  two: "md:grid-cols-2",
  three: "md:grid-cols-2 xl:grid-cols-3",
}

export function ResourceList({
  children,
  className,
  columns = "two",
}: ResourceListProps) {
  return (
    <div
      role="list"
      className={cn("grid gap-4", columnClasses[columns], className)}
    >
      {children}
    </div>
  )
}
