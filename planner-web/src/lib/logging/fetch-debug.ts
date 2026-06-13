import { CORRELATION_HEADER, createCorrelationId } from "./correlation"
import { isWebDebugLoggingEnabled } from "./debug-config"
import { summarizeValue } from "./debug-summarizer"
import { debugTrace, getAppLogger } from "./logger"

declare global {
  var __plannerFetchDebugInstalled: boolean | undefined

  var __plannerFetchDebugOriginal: typeof fetch | undefined
}

function toRequest(input: RequestInfo | URL, init?: RequestInit) {
  const request = new Request(input, init)
  const requestId =
    request.headers.get(CORRELATION_HEADER) ?? createCorrelationId()

  request.headers.set(CORRELATION_HEADER, requestId)

  return { request, requestId }
}

export function installDebugFetch(
  fetchImpl: typeof fetch = globalThis.fetch,
  force = false
) {
  if (
    (!isWebDebugLoggingEnabled() && !force) ||
    globalThis.__plannerFetchDebugInstalled
  )
    return

  globalThis.__plannerFetchDebugInstalled = true
  globalThis.__plannerFetchDebugOriginal = fetchImpl.bind(globalThis)

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const { request, requestId } = toRequest(input, init)
    const startedAt = performance.now()

    debugTrace("WEB HTTP IN", {
      requestId,
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    })

    try {
      const response = await globalThis.__plannerFetchDebugOriginal!(request)

      debugTrace("WEB HTTP OUT", {
        requestId,
        method: request.method,
        url: request.url,
        status: response.status,
        durationMs: Math.round(performance.now() - startedAt),
        responseHeaders: Object.fromEntries(response.headers.entries()),
      })

      return response
    } catch (error) {
      getAppLogger().error("WEB HTTP ERROR", {
        requestId,
        method: request.method,
        url: request.url,
        durationMs: Math.round(performance.now() - startedAt),
        error: summarizeValue(error),
      })
      throw error
    }
  }) as typeof fetch
}

export function resetDebugFetch() {
  if (globalThis.__plannerFetchDebugOriginal) {
    globalThis.fetch = globalThis.__plannerFetchDebugOriginal
  }

  globalThis.__plannerFetchDebugInstalled = undefined
  globalThis.__plannerFetchDebugOriginal = undefined
}
