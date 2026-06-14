import { afterEach, describe, expect, it, vi } from "vitest"

import { CORRELATION_HEADER } from "./correlation"
import { resetWebDebugLogging, setWebDebugLoggingEnabled } from "./debug-config"
import { installDebugFetch, resetDebugFetch } from "./fetch-debug"
import { resetAppLogger, setAppLogger } from "./logger"

describe("fetch-debug", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetDebugFetch()
    resetAppLogger()
    resetWebDebugLogging()
  })

  it("does not patch fetch when debug logging is disabled", () => {
    const originalFetch = globalThis.fetch

    setWebDebugLoggingEnabled(false)
    installDebugFetch(originalFetch, false)

    expect(globalThis.fetch).toBe(originalFetch)
  })

  it("wraps fetch and logs requests and responses", async () => {
    const originalFetch = vi.fn(async (request: Request) => {
      expect(request.headers.get(CORRELATION_HEADER)).toBeTruthy()

      return new Response(JSON.stringify({ ok: true }), {
        status: 201,
        headers: {
          "X-Request-Result": "ok",
        },
      })
    }) as unknown as typeof fetch

    const logger = {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn(),
    }

    setAppLogger(logger)
    setWebDebugLoggingEnabled(true)
    installDebugFetch(originalFetch, false)

    const response = await globalThis.fetch("https://example.com/api", {
      method: "POST",
      headers: {
        "X-Test": "1",
      },
    })

    expect(response.status).toBe(201)
    expect(logger.debug).toHaveBeenNthCalledWith(
      1,
      "WEB HTTP IN",
      expect.objectContaining({
        requestId: expect.any(String),
        method: "POST",
        url: "https://example.com/api",
        headers: expect.objectContaining({
          "x-test": "1",
          [CORRELATION_HEADER.toLowerCase()]: expect.any(String),
        }),
      })
    )
    expect(logger.debug).toHaveBeenNthCalledWith(
      2,
      "WEB HTTP OUT",
      expect.objectContaining({
        requestId: expect.any(String),
        method: "POST",
        url: "https://example.com/api",
        status: 201,
        responseHeaders: expect.objectContaining({
          "x-request-result": "ok",
        }),
      })
    )
  })

  it("logs errors and restores the original fetch", async () => {
    const originalFetch = vi.fn(async () => {
      throw new Error("boom")
    }) as unknown as typeof fetch

    const logger = {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn(),
    }

    setAppLogger(logger)
    setWebDebugLoggingEnabled(true)
    installDebugFetch(originalFetch, false)

    await expect(
      globalThis.fetch("https://example.com/api", { method: "GET" })
    ).rejects.toThrow("boom")

    expect(logger.error).toHaveBeenCalledWith(
      "WEB HTTP ERROR",
      expect.objectContaining({
        method: "GET",
        url: "https://example.com/api",
        error: expect.objectContaining({
          name: "Error",
          message: "boom",
        }),
      })
    )

    logger.error.mockClear()
    resetDebugFetch()

    await expect(
      globalThis.fetch("https://example.com/api", { method: "GET" })
    ).rejects.toThrow("boom")

    expect(logger.error).not.toHaveBeenCalled()
  })
})
