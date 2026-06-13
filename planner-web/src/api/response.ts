import { CORRELATION_HEADER } from "@/lib/logging/correlation"
import { debugTrace } from "@/lib/logging/logger"

type ApiResponse<TData, TStatus extends number = number> = {
  data: TData
  status: TStatus
  headers?: Headers
}

type ApiErrorLike = {
  error?: {
    message?: string
  }
}

export function unwrapResponse<
  TResponse extends ApiResponse<unknown, number>,
  TStatus extends TResponse["status"],
>(
  response: TResponse,
  expectedStatus: TStatus
): Extract<TResponse, { status: TStatus }>["data"] {
  if (response.status !== expectedStatus) {
    const message = extractErrorMessage(response.data)

    throw new Error(message ?? `Unexpected API status ${response.status}`)
  }

  debugTrace("API RESPONSE READY", {
    requestId: response.headers?.get(CORRELATION_HEADER) ?? undefined,
    status: response.status,
    data: response.data,
  })

  return response.data as Extract<TResponse, { status: TStatus }>["data"]
}

function extractErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") {
    return null
  }

  const apiError = data as ApiErrorLike

  return apiError.error?.message ?? null
}
