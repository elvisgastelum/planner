import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ConsoleLogger } from '@nestjs/common';

import { PlannerLogger } from './planner-logger.service';
import { runWithRequestContext } from './request-context';

describe('PlannerLogger', () => {
  const originalEnv = process.env.PLANNER_DEBUG;
  const originalArgv = [...process.argv];

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.PLANNER_DEBUG;
    } else {
      process.env.PLANNER_DEBUG = originalEnv;
    }

    process.argv = [...originalArgv];
    jest.restoreAllMocks();
  });

  it('uses the PlannerAPI context', () => {
    const logger = new PlannerLogger();

    expect((logger as unknown as { context: string }).context).toBe(
      'PlannerAPI',
    );
  });

  it('skips debug traces when debug logging is disabled', () => {
    delete process.env.PLANNER_DEBUG;
    process.argv = ['node', 'jest'];

    const debugSpy = jest
      .spyOn(ConsoleLogger.prototype, 'debug')
      .mockImplementation(() => undefined as never);
    const logger = new PlannerLogger();

    logger.debugTrace('TRACE', { foo: 'bar' });

    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('logs debug traces when debug logging is enabled', () => {
    process.env.PLANNER_DEBUG = 'true';

    const debugSpy = jest
      .spyOn(ConsoleLogger.prototype, 'debug')
      .mockImplementation(() => undefined as never);
    const logger = new PlannerLogger();

    runWithRequestContext(
      { requestId: 'req-1', method: 'GET', path: '/plans' },
      () => {
        logger.debugTrace('TRACE', { foo: 'bar' });
      },
    );

    expect(debugSpy).toHaveBeenCalledWith('[req-1] TRACE {"foo":"bar"}');
  });

  it('logs info traces with request context', () => {
    process.env.PLANNER_DEBUG = 'true';

    const logSpy = jest
      .spyOn(ConsoleLogger.prototype, 'log')
      .mockImplementation(() => undefined as never);
    const logger = new PlannerLogger();

    runWithRequestContext(
      { requestId: 'req-2', method: 'POST', path: '/plans' },
      () => {
        logger.infoTrace('INFO', { foo: 'bar' });
      },
    );

    expect(logSpy).toHaveBeenCalledWith('[req-2] INFO {"foo":"bar"}');
  });

  it('always logs warn traces', () => {
    const warnSpy = jest
      .spyOn(ConsoleLogger.prototype, 'warn')
      .mockImplementation(() => undefined as never);
    const logger = new PlannerLogger();

    logger.warnTrace('WARN', { foo: 'bar' });

    expect(warnSpy).toHaveBeenCalledWith('WARN {"foo":"bar"}');
  });

  it('always logs error traces', () => {
    const errorSpy = jest
      .spyOn(ConsoleLogger.prototype, 'error')
      .mockImplementation(() => undefined as never);
    const logger = new PlannerLogger();

    logger.errorTrace('ERROR', { foo: 'bar' });

    expect(errorSpy).toHaveBeenCalledWith('ERROR {"foo":"bar"}');
  });

  it('prefixes warn and error traces with the request context', () => {
    process.env.PLANNER_DEBUG = 'true';

    const warnSpy = jest
      .spyOn(ConsoleLogger.prototype, 'warn')
      .mockImplementation(() => undefined as never);
    const errorSpy = jest
      .spyOn(ConsoleLogger.prototype, 'error')
      .mockImplementation(() => undefined as never);
    const logger = new PlannerLogger();

    runWithRequestContext(
      { requestId: 'req-3', method: 'DELETE', path: '/plans/3' },
      () => {
        logger.warnTrace('WARN', { foo: 'bar' });
        logger.errorTrace('ERROR', { foo: 'bar' });
      },
    );

    expect(warnSpy).toHaveBeenCalledWith('[req-3] WARN {"foo":"bar"}');
    expect(errorSpy).toHaveBeenCalledWith('[req-3] ERROR {"foo":"bar"}');
  });

  it('delegates summarize to the shared summarizer', () => {
    const logger = new PlannerLogger();
    const payload = { nested: ['a', 'b', 'c'] };

    expect(logger.summarize(payload)).toEqual({
      nested: {
        type: 'array',
        length: 3,
        sample: ['a', 'b', 'c'],
      },
    });
  });
});
