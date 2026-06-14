import { afterEach, describe, expect, it, vi } from "vitest"

import { resetWebDebugLogging, setWebDebugLoggingEnabled } from "./debug-config"
import {
  createConsoleLogger,
  debugTrace,
  getAppLogger,
  resetAppLogger,
  setAppLogger,
} from "./logger"

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetAppLogger()
    resetWebDebugLogging()
  })

  it("writes console logs only when enabled", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {})
    const logger = createConsoleLogger(true)

    logger.log("LOG", { foo: "bar" })
    logger.debug("DEBUG", { foo: "bar" })
    logger.verbose("VERBOSE", { foo: "bar" })

    expect(logSpy).toHaveBeenCalledWith('LOG {"foo":"bar"}')
    expect(debugSpy).toHaveBeenNthCalledWith(1, 'DEBUG {"foo":"bar"}')
    expect(debugSpy).toHaveBeenNthCalledWith(2, 'VERBOSE {"foo":"bar"}')
  })

  it("always writes warnings and errors", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const logger = createConsoleLogger(false)

    logger.warn("WARN", { foo: "bar" })
    logger.error("ERROR", { foo: "bar" })

    expect(warnSpy).toHaveBeenCalledWith('WARN {"foo":"bar"}')
    expect(errorSpy).toHaveBeenCalledWith('ERROR {"foo":"bar"}')
  })

  it("manages the active logger singleton", () => {
    const logger = createConsoleLogger(false)

    setAppLogger(logger)
    expect(getAppLogger()).toBe(logger)

    resetAppLogger()
    expect(getAppLogger()).not.toBe(logger)
  })

  it("respects the web debug flag", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {})
    const logger = createConsoleLogger(true)

    setAppLogger(logger)
    setWebDebugLoggingEnabled(true)
    debugTrace("TRACE", { foo: "bar" })

    expect(debugSpy).toHaveBeenCalledWith('TRACE {"foo":"bar"}')

    setWebDebugLoggingEnabled(false)
    debugTrace("TRACE", { foo: "bar" })

    expect(debugSpy).toHaveBeenCalledTimes(1)
  })
})
