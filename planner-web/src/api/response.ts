type ApiResponse<TData, TStatus extends number = number> = {
  data: TData
  status: TStatus
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

  return response.data as Extract<TResponse, { status: TStatus }>["data"]
}

function extractErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") {
    return null
  }

  const apiError = data as ApiErrorLike

  return apiError.error?.message ?? null
}
