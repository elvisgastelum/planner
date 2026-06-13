export const CORRELATION_HEADER = "X-Correlation-Id"

export function createCorrelationId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `cid-${Math.random().toString(36).slice(2)}`
  )
}
