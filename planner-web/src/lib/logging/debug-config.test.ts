import { afterEach, describe, expect, it } from "vitest"

import {
  isWebDebugLoggingEnabled,
  resetWebDebugLogging,
  setWebDebugLoggingEnabled,
} from "./debug-config"

describe("debug-config", () => {
  afterEach(() => {
    resetWebDebugLogging()
  })

  it("respects the runtime override", () => {
    const initial = isWebDebugLoggingEnabled()

    setWebDebugLoggingEnabled(!initial)
    expect(isWebDebugLoggingEnabled()).toBe(!initial)

    resetWebDebugLogging()
    expect(isWebDebugLoggingEnabled()).toBe(initial)
  })

  it("can be forced off", () => {
    setWebDebugLoggingEnabled(false)

    expect(isWebDebugLoggingEnabled()).toBe(false)
  })
})
