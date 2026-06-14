import { afterEach, describe, expect, it } from '@jest/globals';

import { getNestLoggerLevels, isDebugLoggingEnabled } from './debug-config';

describe('debug-config', () => {
  const originalEnv = process.env.PLANNER_DEBUG;
  const originalArgv = [...process.argv];

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.PLANNER_DEBUG;
    } else {
      process.env.PLANNER_DEBUG = originalEnv;
    }

    process.argv = [...originalArgv];
  });

  it('defaults to disabled debug logging', () => {
    delete process.env.PLANNER_DEBUG;
    process.argv = ['node', 'jest'];

    expect(isDebugLoggingEnabled()).toBe(false);
    expect(getNestLoggerLevels()).toEqual(['error', 'warn', 'log']);
  });

  it('enables debug logging from the environment', () => {
    process.env.PLANNER_DEBUG = 'true';
    process.argv = ['node', 'jest'];

    expect(isDebugLoggingEnabled()).toBe(true);
    expect(getNestLoggerLevels()).toEqual([
      'error',
      'warn',
      'log',
      'debug',
      'verbose',
    ]);
  });

  it.each(['--verbose', '-v', '--debug', '-d'])(
    'enables debug logging from CLI flag %s',
    (flag) => {
      delete process.env.PLANNER_DEBUG;
      process.argv = ['node', 'jest', flag];

      expect(isDebugLoggingEnabled()).toBe(true);
    },
  );
});
