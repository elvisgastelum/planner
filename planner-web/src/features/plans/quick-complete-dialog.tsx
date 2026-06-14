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
import { Textarea } from "@/components/ui/textarea"
import { FieldShell } from "@/features/plans/plan-ui"

export function QuickCompleteDialog({
  disabled = false,
  onComplete,
  plannedAmount,
  triggerLabel = "Complete",
}: {
  disabled?: boolean
  onComplete: (data: { actualAmount: number; notes?: string }) => Promise<void>
  plannedAmount: number
  triggerLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [actualAmount, setActualAmount] = useState(String(plannedAmount))
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
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
