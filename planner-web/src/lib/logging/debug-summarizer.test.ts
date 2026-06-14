import { describe, expect, it } from "vitest"

import { formatDebugMessage, summarizeValue } from "./debug-summarizer"

describe("debug-summarizer", () => {
  it("summarizes primitives, arrays, objects, and errors", () => {
    expect(summarizeValue(null)).toBeNull()
    expect(summarizeValue(undefined)).toBeUndefined()
    expect(summarizeValue("a".repeat(221))).toBe(`${"a".repeat(219)}…`)
    expect(summarizeValue([1, 2, 3, 4])).toEqual({
      type: "array",
      length: 4,
      sample: [1, 2, 3],
    })
    expect(
      summarizeValue({
        first: 1,
        second: { nested: true },
        third: 3,
        fourth: 4,
        fifth: 5,
        sixth: 6,
        seventh: 7,
        eighth: 8,
        ninth: 9,
        tenth: 10,
        eleventh: 11,
      })
    ).toEqual({
      first: 1,
      second: { nested: true },
      third: 3,
      fourth: 4,
      fifth: 5,
      sixth: 6,
      seventh: 7,
      eighth: 8,
      ninth: 9,
      tenth: 10,
    })

    const error = new Error("problem")
    const summary = summarizeValue(error) as {
      name: string
      message: string
      stack?: string
    }

    expect(summary.name).toBe("Error")
    expect(summary.message).toBe("problem")
    expect(summary.stack?.length).toBeLessThanOrEqual(500)
  })

  it("formats debug messages", () => {
    expect(formatDebugMessage("Label")).toBe("Label")
    expect(formatDebugMessage("Label", { foo: "bar" })).toBe(
      'Label {"foo":"bar"}'
    )
  })
})
