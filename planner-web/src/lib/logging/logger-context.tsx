import { createContext, type ReactNode, useEffect } from "react"

import { type AppLogger, setAppLogger } from "./logger"

const LoggerContext = createContext<AppLogger>({
  log: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  verbose: () => {},
})

export function LoggerProvider({
  logger,
  children,
}: {
  logger: AppLogger
  children: ReactNode
}) {
  useEffect(() => {
    setAppLogger(logger)
  }, [logger])

  return (
    <LoggerContext.Provider value={logger}>{children}</LoggerContext.Provider>
  )
}
