import { isWebDebugLoggingEnabled } from "./debug-config"
import { formatDebugMessage } from "./debug-summarizer"

export type AppLogger = {
  log: (message: string, payload?: unknown) => void
  warn: (message: string, payload?: unknown) => void
  error: (message: string, payload?: unknown) => void
  debug: (message: string, payload?: unknown) => void
  verbose: (message: string, payload?: unknown) => void
}

export function createConsoleLogger(
  enabled = isWebDebugLoggingEnabled()
): AppLogger {
  return {
    log: (message, payload) => {
      if (!enabled) return
      console.log(formatDebugMessage(message, payload))
    },
    warn: (message, payload) => {
      console.warn(formatDebugMessage(message, payload))
    },
    error: (message, payload) => {
      console.error(formatDebugMessage(message, payload))
    },
    debug: (message, payload) => {
      if (!enabled) return
      console.debug(formatDebugMessage(message, payload))
    },
    verbose: (message, payload) => {
      if (!enabled) return
      console.debug(formatDebugMessage(message, payload))
    },
  }
}

let activeLogger: AppLogger = createConsoleLogger()

export function setAppLogger(logger: AppLogger) {
  activeLogger = logger
}

export function resetAppLogger() {
  activeLogger = createConsoleLogger()
}

export function getAppLogger() {
  return activeLogger
}

export function debugTrace(label: string, payload?: unknown) {
  if (!isWebDebugLoggingEnabled()) return
  activeLogger.debug(label, payload)
}
