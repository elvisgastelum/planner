/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  filterIncomePayments,
  resolveGeneratedThrough,
} from './plan-financiero.seed';

describe('plan-financiero seed helpers', () => {
  it('filters out income payments beyond the plan window', () => {
    const payments = [
      { id: 'income-1', date: '2026-06-19' },
      { id: 'income-2', date: '2026-08-14' },
      { id: 'income-3', date: '2027-12-31' },
    ];
    const periods = [
      { income: { id: 'income-1' } },
      { income: { id: 'income-2' } },
    ];

    expect(filterIncomePayments(payments, periods, '2026-08-14')).toEqual([
      { id: 'income-1', date: '2026-06-19' },
      { id: 'income-2', date: '2026-08-14' },
    ]);
  });

  it('clamps generatedThrough to the seeded payments', () => {
    const generatedThrough = resolveGeneratedThrough(
      { generated_through: '2027-12-31' },
      [{ date: '2026-06-19' }, { date: '2026-08-14' }],
      '2026-08-14',
    );

    expect(generatedThrough).toBe('2026-08-14');
  });
});
