import { defineNetworkFixture, type NetworkFixture } from "@msw/playwright"
import { expect,test as base } from "@playwright/test"
import type { AnyHandler } from "msw"

import { getBaseGeneratedHandlers } from "../mocks/base-generated-handlers"
import { getE2eGeneratedHandlers } from "../mocks/generated-handlers"

interface Fixtures {
  handlers: Array<AnyHandler>
  network: NetworkFixture
}

// Default handlers shared across all tests (overridable per-test via the `handlers` option)
const defaultHandlers: Array<AnyHandler> = [
  ...getE2eGeneratedHandlers(),
  ...getBaseGeneratedHandlers(),
]

export const test = base.extend<Fixtures>({
  handlers: [defaultHandlers, { option: true }],

  network: [
    async ({ context, handlers }, use) => {
      const network = defineNetworkFixture({
        context,
        handlers,
        onUnhandledRequest: "warn",
        skipAssetRequests: true,
      })

      await network.enable()
      await use(network)
      await network.disable()
    },
    { auto: true },
  ],
})

export { expect }


