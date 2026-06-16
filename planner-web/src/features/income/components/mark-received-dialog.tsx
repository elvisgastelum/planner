import { Link } from "@tanstack/react-router"
import { useState } from "react"

import type { AccountResponseDto } from "@/api/generated/model"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type MarkReceivedDialogProps = {
  /** Amount for display */
  amount: number
  /** Currency for display */
  currency: string
  /** Date for display */
  date: string
  /** Linked account ID (null if no account linked) */
  accountId: string | null
  /** Linked account name (null if no account linked) */
  accountName: string | null
  /** All accounts for selection */
  accounts: AccountResponseDto[]
  /** Disabled when mutation is pending */
  disabled?: boolean
  /** Called when user confirms receipt */
  onConfirm: (input: { accountId?: string }) => Promise<void>
}

export function MarkReceivedDialog({
  amount,
  currency,
  date,
  accountId,
  accountName,
  accounts,
  disabled = false,
  onConfirm,
}: MarkReceivedDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState(
    accountId ?? "none"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasLinkedAccount = Boolean(accountId && accountName)
  const needsAccountSelection = !hasLinkedAccount
  const canConfirm = !needsAccountSelection || selectedAccountId !== "none"

  async function handleConfirm() {
    try {
      setIsSubmitting(true)
      setError(null)
      await onConfirm({
        accountId: selectedAccountId === "none" ? undefined : selectedAccountId,
      })
      setOpen(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark as received."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (newOpen) {
      setSelectedAccountId(accountId ?? "none")
      setError(null)
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button disabled={disabled} size="sm" variant="default">
          Mark received
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Mark payment as received</DialogTitle>
          <DialogDescription>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
            }).format(amount)}
            &nbsp; ·· {date}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {hasLinkedAccount ? (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Receiving account</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {accountName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                The amount will be added to this account balance.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select receiving account
                </label>
                <p className="text-xs text-muted-foreground">
                  This income payment needs an account before it can be marked
                  as received.
                </p>
                <Select
                  onValueChange={setSelectedAccountId}
                  value={selectedAccountId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.length === 0 ? (
                      <SelectItem value="no-accounts" disabled>
                        No accounts yet
                      </SelectItem>
                    ) : (
                      accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button asChild className="w-fit" size="sm" variant="ghost">
                <Link params={{ planId: "" }} to="/plans/$planId/accounts/new">
                  + New account
                </Link>
              </Button>
            </>
          )}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button
            onClick={() => setOpen(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || !canConfirm}
            onClick={() => void handleConfirm()}
            type="button"
          >
            {isSubmitting ? "Confirming..." : "Confirm receipt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
