import type { FormEvent } from "react"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FieldShell } from "@/features/plans/plan-ui"

export function QuickCompleteDialog({
  disabled = false,
  onComplete,
  plannedAmount,
  triggerLabel = "Complete",
  accountId,
  accounts,
}: {
  disabled?: boolean
  onComplete: (data: {
    actualAmount: number
    notes?: string
    accountId?: string
  }) => Promise<void>
  plannedAmount: number
  triggerLabel?: string
  /** Linked account ID (null if no account linked) */
  accountId?: string | null
  /** Available accounts for selection */
  accounts?: Array<{ id: string; name: string }>
}) {
  const [open, setOpen] = useState(false)
  const [actualAmount, setActualAmount] = useState(String(plannedAmount))
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState(
    accountId ?? "none"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitGuardRef = useRef(false)
  const isLocked = disabled || isSubmitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitGuardRef.current) {
      return
    }

    const parsed = Number(actualAmount)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid amount.")
      return
    }

    try {
      submitGuardRef.current = true
      setIsSubmitting(true)
      setError(null)
      await onComplete({
        actualAmount: parsed,
        notes: notes.trim() || undefined,
        ...(selectedAccountId !== "none"
          ? { accountId: selectedAccountId }
          : {}),
      })
      setOpen(false)
      setNotes("")
      setActualAmount(String(plannedAmount))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete item.")
    } finally {
      submitGuardRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setActualAmount(String(plannedAmount))
          setNotes("")
          setError(null)
          setSelectedAccountId(accountId ?? "none")
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button disabled={isLocked} size="sm" type="button" variant="default">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <DialogHeader>
            <DialogTitle>Complete item</DialogTitle>
            <DialogDescription>
              Confirm the actual amount and add optional notes.
            </DialogDescription>
          </DialogHeader>

          <FieldShell label="Actual amount">
            <Input
              disabled={isLocked}
              min="0"
              onChange={(event) => setActualAmount(event.currentTarget.value)}
              type="number"
              value={actualAmount}
            />
          </FieldShell>

          <div className="grid gap-2">
            <Label htmlFor="quick-complete-notes">Notes</Label>
            <Textarea
              id="quick-complete-notes"
              disabled={isLocked}
              onChange={(event) => setNotes(event.currentTarget.value)}
              placeholder="Optional completion notes"
              value={notes}
            />
          </div>

          {accounts && accounts.length > 0 ? (
            <div className="space-y-2">
              <label
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="quick-complete-account"
              >
                Account paid from
              </label>
              <Select
                onValueChange={setSelectedAccountId}
                value={selectedAccountId}
              >
                <SelectTrigger id="quick-complete-account">
                  <SelectValue placeholder="Select account (required)" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!accountId && selectedAccountId === "none" ? (
                <p className="text-xs text-muted-foreground">
                  Select an account to track where this payment comes from.
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button
              onClick={() => setOpen(false)}
              disabled={isLocked}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isLocked} type="submit">
              {isSubmitting ? "Completing..." : "Complete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
