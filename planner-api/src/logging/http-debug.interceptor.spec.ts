import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import type { Response } from 'express';
import { lastValueFrom, of, throwError } from 'rxjs';

import { HttpDebugInterceptor } from './http-debug.interceptor';
import { PlannerLogger } from './planner-logger.service';

describe('HttpDebugInterceptor', () => {
  const originalEnv = process.env.PLANNER_DEBUG;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.PLANNER_DEBUG;
    } else {
      process.env.PLANNER_DEBUG = originalEnv;
    }

    jest.restoreAllMocks();
  });

  it('passes through when debug logging is disabled', async () => {
    delete process.env.PLANNER_DEBUG;

    const logger = new PlannerLogger();
    const interceptor = new HttpDebugInterceptor(logger);
    const next = {
      handle: jest.fn(() => of({ ok: true })),
    };
    const context = createExecutionContext();

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).resolves.toEqual({ ok: true });

    expect(next.handle).toHaveBeenCalledTimes(1);
  });

  it('logs incoming and outgoing requests when debug logging is enabled', async () => {
    process.env.PLANNER_DEBUG = 'true';

    const logger = new PlannerLogger();
    const debugTraceSpy = jest
      .spyOn(logger, 'debugTrace')
      .mockImplementation(() => undefined as never);
    const interceptor = new HttpDebugInterceptor(logger);
    const response = {
      statusCode: 201,
      setHeader: jest.fn(),
    };
    const context = createExecutionContext(
      {
        'x-correlation-id': 'cid-4fzzzxjylrx',
      },
      response as any,
    );
    const next = {
      handle: jest.fn(() => of({ ok: true })),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).resolves.toEqual({ ok: true });

    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Correlation-Id',
      'cid-4fzzzxjylrx',
    );
    expect(debugTraceSpy).toHaveBeenNthCalledWith(
      1,
      'HTTP IN',
      expect.objectContaining({
        requestId: 'cid-4fzzzxjylrx',
        method: 'POST',
        path: '/plans/42',
      }),
    );
    expect(debugTraceSpy).toHaveBeenNthCalledWith(
      2,
      'HTTP OUT',
      expect.objectContaining({
        requestId: 'cid-4fzzzxjylrx',
        statusCode: 201,
        response: { ok: true },
      }),
    );
  });

  it('generates a correlation id when the request does not provide one', async () => {
    process.env.PLANNER_DEBUG = 'true';

    const logger = new PlannerLogger();
    const debugTraceSpy = jest
      .spyOn(logger, 'debugTrace')
      .mockImplementation(() => undefined as never);
    const interceptor = new HttpDebugInterceptor(logger);
    const response = {
      statusCode: 200,
      setHeader: jest.fn(),
    };
    const context = createExecutionContext({}, response as any);
    const next = {
      handle: jest.fn(() => of({ ok: true })),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).resolves.toEqual({ ok: true });

    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Correlation-Id',
      expect.any(String),
    );
    expect(debugTraceSpy).toHaveBeenNthCalledWith(
      1,
      'HTTP IN',
      expect.objectContaining({
        requestId: expect.any(String),
      }),
    );
  });

  it('logs errors when the handler fails', async () => {
    process.env.PLANNER_DEBUG = 'true';

    const logger = new PlannerLogger();
    const errorTraceSpy = jest
      .spyOn(logger, 'errorTrace')
      .mockImplementation(() => undefined as never);
    const interceptor = new HttpDebugInterceptor(logger);
    const context = createExecutionContext({
      'x-correlation-id': 'cid-4fzzzxjylrx',
    });
    const next = {
      handle: jest.fn(() => throwError(() => new Error('boom'))),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toThrow('boom');

    expect(errorTraceSpy).toHaveBeenCalledWith(
      'HTTP ERROR',
      expect.objectContaining({
        requestId: 'cid-4fzzzxjylrx',
        method: 'POST',
        path: '/plans/42',
        error: expect.objectContaining({
          name: 'Error',
          message: 'boom',
        }),
      }),
    );
  });
});

function createExecutionContext(
  headers: Record<string, string> = {},
  response: Partial<Response> = {},
) {
  const request = {
    method: 'POST',
    url: '/plans/42',
    originalUrl: '/plans/42',
    headers,
    params: { planId: '42' },
    query: { view: 'summary' },
    body: { nested: { hello: 'world' } },
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({
        statusCode: 201,
        setHeader: jest.fn(),
        ...response,
      }),
    }),
  } as unknown as ExecutionContext;
}
