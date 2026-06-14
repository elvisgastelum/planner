import { afterEach, vi } from "vitest"

import { resetWebDebugLogging } from "@/lib/logging/debug-config"
import { resetDebugFetch } from "@/lib/logging/fetch-debug"
import { resetAppLogger } from "@/lib/logging/logger"

afterEach(() => {
  vi.restoreAllMocks()
  resetAppLogger()
  resetWebDebugLogging()
  resetDebugFetch()
})
