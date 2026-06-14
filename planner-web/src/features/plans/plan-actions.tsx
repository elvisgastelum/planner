import { MoreHorizontal } from "lucide-react"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type StatusAction<TStatus extends string> = {
  confirmDescription?: string
  confirmTitle?: string
  label: string
  targetStatus: TStatus
  variant?: "default" | "destructive" | "outline"
}

export function StatusActionMenu<TStatus extends string>({
  actions,
  disabled = false,
  onStatusChange,
}: {
  actions: StatusAction<TStatus>[]
  disabled?: boolean
  onStatusChange: (status: TStatus) => Promise<void> | void
}) {
  const [confirmAction, setConfirmAction] =
    useState<StatusAction<TStatus> | null>(null)

  if (actions.length === 0) {
    return null
  }

  async function handleAction(action: StatusAction<TStatus>) {
    if (action.confirmTitle) {
      setConfirmAction(action)
      return
    }

    await onStatusChange(action.targetStatus)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={disabled}
            onClick={(event) => event.stopPropagation()}
            size="icon"
            variant="ghost"
          >
            <MoreHorizontal />
            <span className="sr-only">Open actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => (
            <DropdownMenuItem
              className={
                action.variant === "destructive"
                  ? "text-destructive"
                  : undefined
              }
              key={`${action.label}-${action.targetStatus}`}
              onSelect={() => {
                void handleAction(action)
              }}
            >
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
        open={Boolean(confirmAction)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.confirmTitle ??
                confirmAction?.label ??
                "Confirm action"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmDescription ??
                "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmAction) return
                void onStatusChange(confirmAction.targetStatus)
                setConfirmAction(null)
              }}
            >
              {confirmAction?.label ?? "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
