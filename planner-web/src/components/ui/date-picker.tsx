import { CalendarIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function parseDateValue(value: string) {
  if (!value) {
    return undefined
  }

  const date = new Date(`${value}T00:00:00`)

  return Number.isNaN(date.getTime()) ? undefined : date
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function DatePicker({
  className,
  disabled = false,
  onChange,
  placeholder = "Pick a date",
  required = false,
  value = "",
}: {
  className?: string
  disabled?: boolean
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  value?: string
}) {
  const selectedDate = parseDateValue(value)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
            type="button"
            variant="outline"
          >
            <CalendarIcon data-icon="inline-start" />
            {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            onSelect={(date: Date | undefined) =>
              onChange(date ? formatDateValue(date) : "")
            }
            required={required}
            selected={selectedDate}
          />
        </PopoverContent>
      </Popover>
      {!required && value ? (
        <Button
          aria-label="Clear date"
          onClick={() => onChange("")}
          type="button"
          variant="outline"
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  )
}

export { DatePicker }
