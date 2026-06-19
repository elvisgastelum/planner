import { getHealthMock, getPlansMock } from "../../src/api/generated/endpoints/index.msw"

export const getBaseGeneratedHandlers = () => [
  ...getHealthMock(),
  ...getPlansMock(),
]
