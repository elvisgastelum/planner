const DEBUG_FLAGS = new Set(['--verbose', '-v', '--debug', '-d']);

export function isDebugLoggingEnabled() {
  if (process.env.PLANNER_DEBUG === 'true') {
    return true;
  }

  return process.argv.some((arg) => DEBUG_FLAGS.has(arg));
}

export function getNestLoggerLevels() {
  return isDebugLoggingEnabled()
    ? ['error', 'warn', 'log', 'debug', 'verbose']
    : ['error', 'warn', 'log'];
}
