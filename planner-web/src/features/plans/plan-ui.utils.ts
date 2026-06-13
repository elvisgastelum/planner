export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
  }).format(amount)
}

export function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set"
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function toOptionalString(value: string | null | undefined | unknown) {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()

  return trimmed ? trimmed : undefined
}

export function readText(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }

  if (typeof value === "string" || typeof value === "number") {
    return value.toString()
  }

  if (typeof value !== "object") {
    return ""
  }

  const record = value as Record<string, unknown>

  return pickText(record, [
    "value",
    "id",
    "externalId",
    "date",
    "day",
    "actualAmount",
  ])
}

export function toOptionalNumber(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  const parsed = Number(trimmed)

  return Number.isFinite(parsed) ? parsed : undefined
}

export function toOptionalPositiveNumber(value: string) {
  const parsed = toOptionalNumber(value)

  return parsed !== undefined && parsed >= 0 ? parsed : undefined
}

export function toOptionalPositiveInteger(value: string) {
  const parsed = toOptionalNumber(value)

  return parsed !== undefined && Number.isInteger(parsed) && parsed >= 1
    ? parsed
    : undefined
}

export function parseNumberList(value: string) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item))
}

export function isPositiveIntegerListValid(value: string) {
  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  return (
    values.length > 0 &&
    values.every((item) => {
      const parsed = Number(item)

      return Number.isInteger(parsed) && parsed >= 1
    })
  )
}

export function parsePositiveIntegerList(value: string) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 1)
}

export function getReferenceId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return value.toString()
  }

  if (value === null || value === undefined || typeof value !== "object") {
    return ""
  }

  const record = value as Record<string, unknown>

  return pickString(record, ["id", "externalId", "value", "code"])
}

export function describeReference(value: unknown) {
  if (!value || typeof value !== "object") {
    return "Not linked"
  }

  const record = value as Record<string, unknown>

  return (
    pickString(record, ["name", "label", "concept", "id", "externalId"]) ||
    JSON.stringify(record)
  )
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  return ""
}

function pickText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "string" || typeof value === "number") {
      return value.toString()
    }
  }

  return ""
}
