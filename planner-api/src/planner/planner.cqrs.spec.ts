import { TestBed } from '@automock/jest';

import { GenerateIncomePaymentsDto } from './dto';
import {
  DeleteIncomeScheduleCommand,
  DeleteIncomeScheduleHandler,
  GenerateIncomePaymentsCommand,
  GenerateIncomePaymentsHandler,
} from './planner.cqrs';
import { PlannerService } from './planner.service';

describe('GenerateIncomePaymentsHandler', () => {
  it('delegates dynamic income generation to the planner service', async () => {
    const { unit, unitRef } = TestBed.create(
      GenerateIncomePaymentsHandler,
    ).compile();
    const service = unitRef.get(PlannerService);
    const dto: GenerateIncomePaymentsDto = { through: '2026-08-31' };
    const generated = [{ id: 'income-2026-08-14' }];

    jest
      .spyOn(service, 'generateIncomePayments')
      .mockResolvedValue(generated as never);

    await expect(
      unit.execute(new GenerateIncomePaymentsCommand('plan-id', dto)),
    ).resolves.toBe(generated);
    expect(service.generateIncomePayments).toHaveBeenCalledWith(
      'plan-id',
      '2026-08-31',
    );
  });
});

describe('DeleteIncomeScheduleHandler', () => {
  it('delegates income schedule deletion to the planner service', async () => {
    const { unit, unitRef } = TestBed.create(
      DeleteIncomeScheduleHandler,
    ).compile();
    const service = unitRef.get(PlannerService);

    jest
      .spyOn(service, 'deleteIncomeSchedule')
      .mockResolvedValue({ deleted: true });

    await expect(
      unit.execute(new DeleteIncomeScheduleCommand('plan-id')),
    ).resolves.toEqual({ deleted: true });
    expect(service.deleteIncomeSchedule).toHaveBeenCalledWith('plan-id');
  });
});
