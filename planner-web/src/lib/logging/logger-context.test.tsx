import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { type AppLogger } from "./logger"
import { LoggerProvider } from "./logger-context"

const mocks = vi.hoisted(() => ({
  setAppLoggerSpy: vi.fn(),
}))

vi.mock("./logger", async () => {
  return {
    setAppLogger: mocks.setAppLoggerSpy,
  }
})

describe("LoggerProvider", () => {
  afterEach(() => {
    cleanup()
    mocks.setAppLoggerSpy.mockReset()
  })

  it("installs the provided logger on mount", () => {
    const logger: AppLogger = {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn(),
    }

    const { getByText } = render(
      <LoggerProvider logger={logger}>
        <span>child</span>
      </LoggerProvider>
    )

    expect(getByText("child")).toBeTruthy()
    expect(mocks.setAppLoggerSpy).toHaveBeenCalledWith(logger)
  })
})
