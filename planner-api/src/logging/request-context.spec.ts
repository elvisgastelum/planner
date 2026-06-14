import { describe, expect, it } from '@jest/globals';

import { getRequestContext, runWithRequestContext } from './request-context';

describe('request-context', () => {
  it('returns undefined outside a request context', () => {
    expect(getRequestContext()).toBeUndefined();
  });

  it('preserves context through async boundaries', async () => {
    const context = {
      requestId: 'req-1',
      method: 'GET',
      path: '/plans',
    };

    await expect(
      runWithRequestContext(context, async () => {
        await Promise.resolve();
        return getRequestContext();
      }),
    ).resolves.toEqual(context);
  });

  it('isolates nested contexts', async () => {
    const outer = {
      requestId: 'outer',
      method: 'GET',
      path: '/outer',
    };
    const inner = {
      requestId: 'inner',
      method: 'POST',
      path: '/inner',
    };

    await expect(
      runWithRequestContext(outer, async () => {
        expect(getRequestContext()).toEqual(outer);

        return runWithRequestContext(inner, async () => {
          expect(getRequestContext()).toEqual(inner);
          await Promise.resolve();
          return getRequestContext();
        });
      }),
    ).resolves.toEqual(inner);

    expect(getRequestContext()).toBeUndefined();
  });
});
