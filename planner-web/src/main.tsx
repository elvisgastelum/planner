import "./index.css"

import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { queryClient } from "@/api/query-client.ts"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Toaster } from "@/components/ui/sonner"
import { installDebugFetch } from "@/lib/logging/fetch-debug"
import { createConsoleLogger, setAppLogger } from "@/lib/logging/logger"
import { LoggerProvider } from "@/lib/logging/logger-context"
import { router } from "@/router"

const logger = createConsoleLogger()

setAppLogger(logger)
installDebugFetch()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LoggerProvider logger={logger}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Toaster />
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryClientProvider>
    </LoggerProvider>
  </StrictMode>
)
