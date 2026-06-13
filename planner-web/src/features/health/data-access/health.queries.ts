import { queryOptions } from "@tanstack/react-query"

import { healthControllerCheckV1 } from "@/api/generated/endpoints/health/health"
import { CORRELATION_HEADER } from "@/lib/logging/correlation"
import { debugTrace } from "@/lib/logging/logger"

import { healthKeys } from "./health.keys"

export const healthQueries = {
  check: () =>
    queryOptions({
      queryKey: healthKeys.check(),
      queryFn: async ({ signal }) => {
        const response = await healthControllerCheckV1({ signal })

        if (response.status !== 200) {
          throw new Error(`Health check failed with status ${response.status}`)
        }

        debugTrace("HEALTH RESPONSE READY", {
          requestId: response.headers.get(CORRELATION_HEADER) ?? undefined,
          data: response.data,
        })

        return response.data
      },
      staleTime: 10_000,
    }),
}
