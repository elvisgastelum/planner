import { defineConfig } from "orval"

export default defineConfig({
  planner: {
    input: {
      target: "http://127.0.0.1:3000/api/v1/docs-json",
    },
    output: {
      mode: "tags-split",
      target: "src/api/generated/endpoints/planner.ts",
      schemas: "src/api/generated/model",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      formatter: "prettier",
      baseUrl: {
        runtime: "apiBaseUrl",
        imports: [
          {
            name: "apiBaseUrl",
            importPath: "../../env",
          },
        ],
      },
      mock: {
        indexMockFiles: true,
        generators: [
          {
            type: "msw",
            baseUrl: "http://127.0.0.1:3000",
          },
          {
            type: "faker",
            schemas: true,
          },
        ],
      },
      override: {
        query: {
          signal: true,
          shouldExportQueryKey: true,
        },
      },
    },
  },
  plannerZod: {
    input: {
      target: "http://127.0.0.1:3000/api/v1/docs-json",
    },
    output: {
      mode: "tags-split",
      target: "src/api/generated/endpoints/planner.ts",
      client: "zod",
      fileExtension: ".zod.ts",
      formatter: "prettier",
      override: {
        zod: {
          generate: {
            param: true,
            body: true,
            response: true,
            query: true,
            header: true,
          },
        },
      },
    },
  },
})
