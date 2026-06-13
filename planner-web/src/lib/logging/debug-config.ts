let debugOverride: boolean | undefined

export function setWebDebugLoggingEnabled(enabled: boolean | undefined) {
  debugOverride = enabled
}

export function resetWebDebugLogging() {
  debugOverride = undefined
}

export function isWebDebugLoggingEnabled() {
  if (debugOverride !== undefined) {
    return debugOverride
  }

  return import.meta.env.DEV || import.meta.env.VITE_DEBUG_LOGS === "true"
}
