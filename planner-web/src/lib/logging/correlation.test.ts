import { afterEach, describe, expect, it, vi } from "vitest"

import { CORRELATION_HEADER, createCorrelationId } from "./correlation"

describe("correlation", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("exposes the correlation header name", () => {
    expect(CORRELATION_HEADER).toBe("X-Correlation-Id")
  })

  it("creates a non-empty correlation id", () => {
    const correlationId = createCorrelationId()

    expect(typeof correlationId).toBe("string")
    expect(correlationId.length).toBeGreaterThan(0)
  })

  it("falls back to Math.random when crypto.randomUUID is unavailable", () => {
    const randomUUIDSpy = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue(undefined as never)

    const correlationId = createCorrelationId()

    expect(randomUUIDSpy).toHaveBeenCalled()
    expect(correlationId).toMatch(/^cid-/)
  })
})
