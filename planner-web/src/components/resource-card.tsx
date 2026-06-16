import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type ResourceCardMetadataItem = {
  key?: React.Key
  label: ReactNode
  value: ReactNode
}

export type ResourceCardProps = {
  title: ReactNode
  description?: ReactNode
  badge?: ReactNode
  metadata?: ResourceCardMetadataItem[]
  children?: ReactNode
  actions?: ReactNode
  headerActions?: ReactNode
  className?: string
  actionLabel?: string
  headerActionLabel?: string
}

export function ResourceCard({
  title,
  description,
  badge,
  metadata,
  children,
  actions,
  headerActions,
  className,
  actionLabel = "Resource actions",
  headerActionLabel = "Header actions",
}: ResourceCardProps) {
  return (
    <Card role="listitem" className={cn("flex flex-col", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle>{title}</CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          {badge || headerActions ? (
            <div
              className="flex shrink-0 flex-wrap items-center gap-2"
              {...(headerActions
                ? { role: "group", "aria-label": headerActionLabel }
                : {})}
            >
              {badge ? <div className="shrink-0">{badge}</div> : null}
              {headerActions}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 text-sm">
        {metadata && metadata.length > 0 ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            {metadata.map((item, index) => (
              <div
                className="contents"
                key={
                  item.key ??
                  (typeof item.label === "string" ||
                  typeof item.label === "number"
                    ? item.label
                    : index)
                }
              >
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {children}
        {actions ? (
          <div
            className="mt-auto flex flex-wrap justify-end gap-2 border-t pt-3"
            role="group"
            aria-label={actionLabel}
          >
            {actions}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
