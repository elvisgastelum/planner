import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { PlannerLogger } from '../logging/planner-logger.service';
import {
  CompletePaymentPeriodItemDto,
  CreateAccountDto,
  CreateAllocationCategoryDto,
  CreateCompletedItemDto,
  CreateFinancialPlanDto,
  CreateIncomePaymentDto,
  CreateIncomeScheduleDto,
  CreatePaymentPeriodDto,
  CreatePaymentPeriodItemDto,
  CreateRecurringExpenseDto,
  IncomePaymentRefResponseDto,
  IncomePaymentResponseDto,
  IncomePaymentsSummaryResponseDto,
  UpdateAccountDto,
  UpdateAllocationCategoryDto,
  UpdateFinancialPlanDto,
  UpdateIncomePaymentDto,
  UpdateIncomePaymentStatusDto,
  UpdateIncomeScheduleDto,
  UpdatePaymentPeriodDto,
  UpdatePaymentPeriodItemDto,
  UpdateRecurringExpenseDto,
} from './dto';
import {
  AccountEntity,
  AllocationCategoryEntity,
  CompletedItemEntity,
  CurrentAccountBalanceEntity,
  CurrentDebtBalanceEntity,
  DebtProjectionBalanceEntity,
  DebtProjectionSnapshotEntity,
  FinancialPlanEntity,
  IncomeCadence,
  IncomeGenerationMethod,
  IncomePaymentEntity,
  IncomeScheduleAmountRuleEntity,
  IncomeScheduleEntity,
  IncomeSource,
  IncomeStatus,
  ItemStatus,
  PaymentPeriodEntity,
  PaymentPeriodItemEntity,
  PlanRuleEntity,
  PreIncomeAllocationEntity,
  PreIncomeAllocationItemEntity,
  RecurringCustomIntervalUnit,
  RecurringExpenseDayEntity,
  RecurringExpenseEntity,
  RecurringFrequency,
  SummaryNoteEntity,
} from './entities';

@Injectable()
export class PlannerService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: PlannerLogger,
    @InjectRepository(FinancialPlanEntity)
    private readonly plans: Repository<FinancialPlanEntity>,
    @InjectRepository(AccountEntity)
    private readonly accounts: Repository<AccountEntity>,
    @InjectRepository(AllocationCategoryEntity)
    private readonly categories: Repository<AllocationCategoryEntity>,
    @InjectRepository(IncomeScheduleEntity)
    private readonly schedules: Repository<IncomeScheduleEntity>,
    @InjectRepository(IncomeScheduleAmountRuleEntity)
    private readonly amountRules: Repository<IncomeScheduleAmountRuleEntity>,
    @InjectRepository(IncomePaymentEntity)
    private readonly incomePayments: Repository<IncomePaymentEntity>,
    @InjectRepository(PaymentPeriodEntity)
    private readonly paymentPeriods: Repository<PaymentPeriodEntity>,
    @InjectRepository(PaymentPeriodItemEntity)
    private readonly paymentPeriodItems: Repository<PaymentPeriodItemEntity>,
    @InjectRepository(RecurringExpenseEntity)
    private readonly recurringExpenses: Repository<RecurringExpenseEntity>,
    @InjectRepository(RecurringExpenseDayEntity)
    private readonly recurringExpenseDays: Repository<RecurringExpenseDayEntity>,
    @InjectRepository(CompletedItemEntity)
    private readonly completedItems: Repository<CompletedItemEntity>,
    @InjectRepository(PreIncomeAllocationEntity)
    private readonly preIncomeAllocations: Repository<PreIncomeAllocationEntity>,
    @InjectRepository(PreIncomeAllocationItemEntity)
    private readonly preIncomeAllocationItems: Repository<PreIncomeAllocationItemEntity>,
    @InjectRepository(CurrentAccountBalanceEntity)
    private readonly currentAccountBalances: Repository<CurrentAccountBalanceEntity>,
    @InjectRepository(CurrentDebtBalanceEntity)
    private readonly currentDebtBalances: Repository<CurrentDebtBalanceEntity>,
    @InjectRepository(DebtProjectionSnapshotEntity)
    private readonly debtSnapshots: Repository<DebtProjectionSnapshotEntity>,
    @InjectRepository(DebtProjectionBalanceEntity)
    private readonly debtBalances: Repository<DebtProjectionBalanceEntity>,
    @InjectRepository(PlanRuleEntity)
    private readonly rules: Repository<PlanRuleEntity>,
    @InjectRepository(SummaryNoteEntity)
    private readonly summaryNotes: Repository<SummaryNoteEntity>,
  ) {}

  findPlans() {
    return this.plans.find({ order: { createdAt: 'DESC' } });
  }

  async findPlanById(planId: string) {
    this.logger.debugTrace('SERVICE IN findPlanById', { planId });
    return this.findPlanEntity(planId);
  }

  async findPlanOverview(planId: string) {
    this.logger.debugTrace('SERVICE IN findPlanOverview', { planId });
    const plan = await this.findPlanEntity(planId);
    const today = formatIsoDate(new Date());

    const [periodTotals, completedTotals, counts, nextIncomePayment] =
      await Promise.all([
        this.paymentPeriods
          .createQueryBuilder('period')
          .select('COALESCE(SUM(period.plannedTotal), 0)', 'plannedTotal')
          .addSelect(
            'COALESCE(SUM(period.plannedRemaining), 0)',
            'plannedRemaining',
          )
          .where('period.planId = :planId', { planId })
          .getRawOne<{ plannedTotal: string; plannedRemaining: string }>(),
        this.completedItems
          .createQueryBuilder('completedItem')
          .select('COALESCE(SUM(completedItem.amount), 0)', 'completedTotal')
          .where('completedItem.planId = :planId', { planId })
          .getRawOne<{ completedTotal: string }>(),
        Promise.all([
          this.accounts.count({ where: { plan: { id: planId } } }),
          this.incomePayments.count({ where: { plan: { id: planId } } }),
          this.paymentPeriods.count({ where: { plan: { id: planId } } }),
          this.recurringExpenses.count({ where: { plan: { id: planId } } }),
          this.completedItems.count({ where: { plan: { id: planId } } }),
        ]),
        this.incomePayments
          .createQueryBuilder('incomePayment')
          .select(['incomePayment.id', 'incomePayment.date'])
          .where('incomePayment.planId = :planId', { planId })
          .andWhere('incomePayment.date >= :today', { today })
          .orderBy('incomePayment.date', 'ASC')
          .getOne(),
      ]);

    const [
      accountsCount,
      incomePaymentsCount,
      paymentPeriodsCount,
      recurringExpensesCount,
      completedItemsCount,
    ] = counts;

    return {
      ...plan,
      accountsCount,
      completedItemsCount,
      completedTotal: roundMoney(Number(completedTotals?.completedTotal ?? 0)),
      incomePaymentsCount,
      nextIncomeDate: nextIncomePayment?.date ?? null,
      paymentPeriodsCount,
      plannedRemaining: roundMoney(Number(periodTotals?.plannedRemaining ?? 0)),
      plannedTotal: roundMoney(Number(periodTotals?.plannedTotal ?? 0)),
      recurringExpensesCount,
    };
  }

  async findPlanEditForm(planId: string) {
    this.logger.debugTrace('SERVICE IN findPlanEditForm', { planId });
    const plan = await this.findPlanEntity(planId);
    return {
      id: plan.id,
      metadataId: plan.metadataId,
      schemaVersion: plan.schemaVersion,
      name: plan.name,
      currency: plan.currency,
      startDate: plan.startDate,
      endDate: plan.endDate ?? null,
      status: plan.status,
      objective: plan.objective ?? null,
    };
  }

  createPlan(dto: CreateFinancialPlanDto) {
    this.logger.debugTrace('SERVICE IN createPlan', {
      metadataId: dto.metadataId,
      name: dto.name,
    });

    return this.plans.save(
      this.plans.create({
        metadataId: dto.metadataId,
        schemaVersion: dto.schemaVersion ?? '1.0.0',
        name: dto.name,
        currency: dto.currency ?? 'MXN',
        startDate: dto.startDate,
        endDate: dto.endDate ?? null,
        status: dto.status,
        objective: dto.objective ?? null,
      }),
    );
  }

  async updatePlan(planId: string, dto: UpdateFinancialPlanDto) {
    this.logger.debugTrace('SERVICE IN updatePlan', { planId, dto });
    const plan = await this.findPlanEntity(planId);
    Object.assign(plan, dto);
    return this.plans.save(plan);
  }

  async deletePlan(planId: string) {
    this.logger.debugTrace('SERVICE IN deletePlan', { planId });
    const plan = await this.findPlanEntity(planId);
    await this.plans.remove(plan);
    return { deleted: true };
  }

  findAccounts(planId: string) {
    return this.accounts.find({
      where: { plan: { id: planId } },
      order: { name: 'ASC' },
    });
  }

  async findCategories(planId: string, month?: string) {
    await this.findPlanEntity(planId);
    const categories = await this.categories.find({
      where: { plan: { id: planId } },
      order: { key: 'ASC' },
    });

    if (!month) {
      month = formatIsoDate(new Date()).slice(0, 7);
    }

    // Calculate actual percentages from completed items
    const actuals = await this.paymentPeriodItems
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.paymentPeriod', 'period')
      .where('item.status = :status', { status: ItemStatus.Completed })
      .andWhere('item.actualAmount IS NOT NULL')
      .andWhere('period.planId = :planId', { planId })
      .andWhere('period.incomeDate LIKE :month', { month: `${month}%` })
      .getMany();

    const actualsByCategory = new Map<
      string,
      { amount: number; idealPercentage: number }
    >();
    for (const item of actuals) {
      if (item.category?.id) {
        const existing = actualsByCategory.get(item.category.id) ?? {
          amount: 0,
          idealPercentage: item.category.idealPercentage,
        };
        existing.amount += item.actualAmount ?? 0;
        actualsByCategory.set(item.category.id, existing);
      }
    }

    // Get total actual amount for percentage calculation
    const totalActual = Array.from(actualsByCategory.values()).reduce(
      (sum, val) => sum + val.amount,
      0,
    );

    return categories.map((cat) => {
      const actual = actualsByCategory.get(cat.id);
      const actualAmount = actual?.amount ? roundMoney(actual.amount) : null;
      const actualPercentage =
        actual && totalActual > 0
          ? roundMoney((actual.amount / totalActual) * 100)
          : null;
      return {
        ...cat,
        actualAmount,
        actualPercentage,
      };
    });
  }

  async createAccount(planId: string, dto: CreateAccountDto) {
    const plan = await this.findPlanEntity(planId);
    return this.accounts.save(this.accounts.create({ plan, ...dto }));
  }

  async updateAccount(accountId: string, dto: UpdateAccountDto) {
    const account = await this.findAccountEntity(accountId);
    Object.assign(account, dto);
    return this.accounts.save(account);
  }

  async deleteAccount(accountId: string) {
    const account = await this.findAccountEntity(accountId);
    await this.accounts.remove(account);
    return { deleted: true };
  }

  async createCategory(planId: string, dto: CreateAllocationCategoryDto) {
    const plan = await this.findPlanEntity(planId);
    return this.categories.save(
      this.categories.create({
        ...dto,
        description: dto.description ?? null,
        plan,
      }),
    );
  }

  async updateCategory(
    planId: string,
    categoryId: string,
    dto: UpdateAllocationCategoryDto,
  ) {
    const category = await this.findCategoryEntity(planId, categoryId);
    Object.assign(category, dto);
    return this.categories.save(category);
  }

  async deleteCategory(planId: string, categoryId: string) {
    const category = await this.findCategoryEntity(planId, categoryId);
    await this.categories.remove(category);
    return { deleted: true };
  }

  findIncomeSchedule(planId: string) {
    return this.schedules.findOne({
      where: { plan: { id: planId } },
      relations: { amountRules: true },
    });
  }

  async requireIncomeSchedule(planId: string) {
    await this.findPlanEntity(planId);
    const schedule = await this.findIncomeSchedule(planId);
    if (!schedule)
      throw new NotFoundException(`Plan ${planId} has no income schedule`);
    return schedule;
  }

  async upsertIncomeSchedule(
    planId: string,
    dto: CreateIncomeScheduleDto | UpdateIncomeScheduleDto,
  ) {
    const plan = await this.findPlanEntity(planId);
    let schedule = await this.schedules.findOne({
      where: { plan: { id: planId } },
      relations: { amountRules: true },
    });
    if (!schedule) {
      schedule = this.schedules.create({
        plan,
        cadence: IncomeCadence.Every14Days,
        anchorPaymentDate: plan.startDate,
      });
    }
    Object.assign(schedule, {
      cadence: dto.cadence ?? schedule.cadence,
      anchorPaymentDate: dto.anchorPaymentDate ?? schedule.anchorPaymentDate,
      currency: dto.currency ?? schedule.currency ?? plan.currency,
      ordinaryMonthGrossIncome:
        dto.ordinaryMonthGrossIncome ??
        schedule.ordinaryMonthGrossIncome ??
        null,
      ordinaryMonthNetReference:
        dto.ordinaryMonthNetReference ??
        schedule.ordinaryMonthNetReference ??
        null,
      calculationRule: dto.calculationRule ?? schedule.calculationRule ?? null,
    });
    schedule = await this.schedules.save(schedule);
    if (dto.amountRules) {
      await this.amountRules.delete({ incomeSchedule: { id: schedule.id } });
      await this.amountRules.save(
        dto.amountRules.map((rule) =>
          this.amountRules.create({
            incomeSchedule: schedule,
            paymentNumberInMonth: rule.paymentNumberInMonth,
            amount: rule.amount,
            currency: rule.currency ?? schedule.currency,
          }),
        ),
      );
    }
    return this.findIncomeSchedule(planId);
  }

  async deleteIncomeSchedule(planId: string) {
    const schedule = await this.requireIncomeSchedule(planId);
    await this.schedules.remove(schedule);
    return { deleted: true };
  }

  findIncomePayments(planId: string) {
    return this.incomePayments.find({
      where: { plan: { id: planId } },
      order: { date: 'ASC' },
    });
  }

  async findIncomePaymentById(planId: string, incomePaymentId: string) {
    const payment = await this.incomePayments.findOne({
      where: { id: incomePaymentId, plan: { id: planId } },
    });
    if (!payment)
      throw new NotFoundException(
        `Income payment ${incomePaymentId} was not found`,
      );
    return payment;
  }

  async findIncomePaymentRefs(planId: string) {
    this.logger.debugTrace('SERVICE IN findIncomePaymentRefs', { planId });
    const payments = await this.incomePayments.find({
      where: { plan: { id: planId } },
      relations: { account: true },
      order: { date: 'ASC' },
    });
    return payments.map((payment) => this.toIncomePaymentRefResponse(payment)!);
  }

  async generateIncomePayments(planId: string, through: string) {
    this.logger.debugTrace('SERVICE IN generateIncomePayments', {
      planId,
      through,
    });
    const plan = await this.findPlanEntity(planId);
    const schedule = await this.requireIncomeSchedule(planId);
    const rules = new Map(
      schedule.amountRules.map((rule) => [rule.paymentNumberInMonth, rule]),
    );
    const generated: IncomePaymentEntity[] = [];
    const monthCounts = new Map<string, number>();
    let current = parseIsoDate(schedule.anchorPaymentDate);
    const end = parseIsoDate(through);

    while (current <= end) {
      const date = formatIsoDate(current);
      const month = date.slice(0, 7);
      const paymentNumberInMonth = (monthCounts.get(month) ?? 0) + 1;
      monthCounts.set(month, paymentNumberInMonth);
      const rule = rules.get(paymentNumberInMonth);
      if (!rule) {
        throw new BadRequestException(
          `No amount rule exists for payment ${paymentNumberInMonth} in ${month}`,
        );
      }
      const existing = await this.incomePayments.findOne({
        where: { plan: { id: planId }, externalId: `income-${date}` },
      });
      if (!existing) {
        generated.push(
          this.incomePayments.create({
            plan,
            incomeSchedule: schedule,
            externalId: `income-${date}`,
            date,
            month,
            paymentNumberInMonth,
            amount: rule.amount,
            currency: rule.currency,
            status: IncomeStatus.Projected,
            source: IncomeSource.Generated,
          }),
        );
      }
      current = addDays(current, 14);
    }

    await this.incomePayments.save(generated);
    schedule.generatedThrough = through;
    schedule.generationMethod = IncomeGenerationMethod.RuleBased;
    await this.schedules.save(schedule);

    this.logger.debugTrace('SERVICE OUT generateIncomePayments', {
      planId,
      generated: generated.length,
      generatedThrough: through,
    });

    return this.findIncomePayments(planId);
  }

  async createIncomePayment(planId: string, dto: CreateIncomePaymentDto) {
    const plan = await this.findPlanEntity(planId);
    return this.incomePayments.save(
      this.incomePayments.create({
        plan,
        ...dto,
        month: dto.month ?? dto.date.slice(0, 7),
        currency: dto.currency ?? plan.currency,
        status: dto.status ?? IncomeStatus.Projected,
        source: dto.source ?? IncomeSource.Manual,
      }),
    );
  }

  async updateIncomePayment(
    incomePaymentId: string,
    dto: UpdateIncomePaymentDto,
  ) {
    const payment = await this.findIncomePaymentEntity(incomePaymentId);
    Object.assign(
      payment,
      dto,
      dto.date && !dto.month ? { month: dto.date.slice(0, 7) } : {},
    );
    return this.incomePayments.save(payment);
  }

  private buildIncomePaymentResponse(
    entity: IncomePaymentEntity,
  ): IncomePaymentResponseDto {
    return {
      id: entity.id,
      externalId: entity.externalId ?? null,
      date: entity.date,
      month: entity.month,
      paymentNumberInMonth: entity.paymentNumberInMonth,
      amount: entity.amount,
      currency: entity.currency,
      status: entity.status,
      source: entity.source,
      accountId: entity.account?.id ?? null,
      accountName: entity.account?.name ?? null,
    };
  }

  private toIncomePaymentRefResponse(
    entity: IncomePaymentEntity | null,
  ): IncomePaymentRefResponseDto | null {
    if (!entity) return null;
    return {
      id: entity.id,
      date: entity.date,
      month: entity.month,
      paymentNumberInMonth: entity.paymentNumberInMonth ?? 0,
      amount: entity.amount,
      currency: entity.currency,
      status: entity.status,
      source: entity.source,
      accountId: entity.account?.id ?? null,
      accountName: entity.account?.name ?? null,
    };
  }

  async deleteIncomePayment(incomePaymentId: string) {
    const payment = await this.findIncomePaymentEntity(incomePaymentId);
    await this.incomePayments.remove(payment);
    return { deleted: true };
  }

  async updateIncomePaymentStatus(
    incomePaymentId: string,
    dto: UpdateIncomePaymentStatusDto,
  ): Promise<IncomePaymentResponseDto> {
    const payment = await this.incomePayments.findOne({
      where: { id: incomePaymentId },
      relations: { plan: true, account: true },
    });

    if (!payment) {
      throw new NotFoundException(
        `Income payment ${incomePaymentId} was not found`,
      );
    }

    const oldStatus = payment.status;
    const newStatus = dto.status;

    // Use a transaction for all balance-affecting changes
    if (oldStatus !== newStatus) {
      await this.dataSource.transaction(async (manager) => {
        const paymentRepo = manager.getRepository(IncomePaymentEntity);
        const accountRepo = manager.getRepository(AccountEntity);

        // Re-fetch payment inside transaction with correct relations
        const txPayment = await paymentRepo.findOne({
          where: { id: incomePaymentId },
          relations: { plan: true, account: true },
          lock: { mode: 'pessimistic_write' },
        });

        if (!txPayment) {
          throw new NotFoundException(
            `Income payment ${incomePaymentId} was not found`,
          );
        }

        // Handle the "received" transition
        if (newStatus === IncomeStatus.Received) {
          let receivingAccount = txPayment.account;

          // If accountId provided in DTO, find and link that account
          if (dto.accountId) {
            const foundAccount = await accountRepo.findOne({
              where: {
                id: dto.accountId,
                plan: { id: txPayment.plan.id },
              },
            });

            if (!foundAccount) {
              throw new NotFoundException(
                `Account ${dto.accountId} was not found in this plan`,
              );
            }

            txPayment.account = foundAccount;
            receivingAccount = foundAccount;
          }

          if (!receivingAccount) {
            throw new BadRequestException(
              'A receiving account is required to mark an income payment as received. ' +
                'Provide accountId or link an account to the payment first.',
            );
          }

          // Add to balance only if NOT already received (idempotency)
          if (oldStatus !== IncomeStatus.Received) {
            receivingAccount.balance = roundMoney(
              receivingAccount.balance + txPayment.amount,
            );
            await accountRepo.save(receivingAccount);
          }
        }

        // Reverting from received: subtract from balance
        if (
          oldStatus === IncomeStatus.Received &&
          newStatus !== IncomeStatus.Received
        ) {
          if (txPayment.account) {
            txPayment.account.balance = roundMoney(
              txPayment.account.balance - txPayment.amount,
            );
            await accountRepo.save(txPayment.account);
          }
        }

        txPayment.status = newStatus;
        await paymentRepo.save(txPayment);
      });
    } else {
      // Status not changing, just save
      payment.status = newStatus;
      await this.incomePayments.save(payment);
    }

    // Return updated payment with account info
    const updated = await this.incomePayments.findOne({
      where: { id: incomePaymentId },
      relations: { account: true },
    });

    return this.buildIncomePaymentResponse(updated!);
  }

  async findIncomePaymentsSummary(
    planId: string,
  ): Promise<IncomePaymentsSummaryResponseDto> {
    await this.findPlanEntity(planId);

    const now = formatIsoDate(new Date());

    const [aggregated, nextProjectedPayment] = await Promise.all([
      this.incomePayments
        .createQueryBuilder('ip')
        .select('ip.status', 'status')
        .addSelect('COALESCE(SUM(ip.amount), 0)', 'total')
        .addSelect('COUNT(ip.id)', 'count')
        .where('ip.planId = :planId', { planId })
        .groupBy('ip.status')
        .getRawMany<{ status: string; total: string; count: string }>(),
      this.incomePayments
        .createQueryBuilder('ip')
        .select('ip.date', 'date')
        .where('ip.planId = :planId', { planId })
        .andWhere('ip.status = :status', {
          status: IncomeStatus.Projected,
        })
        .andWhere('ip.date >= :now', { now })
        .orderBy('ip.date', 'ASC')
        .getRawOne<{ date: string }>(),
    ]);

    const byStatus = new Map(
      aggregated.map((r) => [
        r.status,
        { total: Number(r.total), count: Number(r.count) },
      ]),
    );

    return {
      totalProjected: roundMoney(
        byStatus.get(IncomeStatus.Projected)?.total ?? 0,
      ),
      totalReceived: roundMoney(
        byStatus.get(IncomeStatus.Received)?.total ?? 0,
      ),
      totalCancelled: roundMoney(
        byStatus.get(IncomeStatus.Cancelled)?.total ?? 0,
      ),
      projectedCount: byStatus.get(IncomeStatus.Projected)?.count ?? 0,
      receivedCount: byStatus.get(IncomeStatus.Received)?.count ?? 0,
      cancelledCount: byStatus.get(IncomeStatus.Cancelled)?.count ?? 0,
      nextProjectedPaymentDate: nextProjectedPayment?.date ?? null,
    };
  }

  findPaymentPeriods(planId: string) {
    return this.paymentPeriods
      .createQueryBuilder('period')
      .leftJoinAndSelect('period.incomePayment', 'incomePayment')
      .leftJoinAndSelect('incomePayment.account', 'account')
      .loadRelationCountAndMap('period.itemsCount', 'period.items')
      .where('period.planId = :planId', { planId })
      .orderBy('period.incomeDate', 'ASC')
      .getMany()
      .then((periods) =>
        periods.map((period) => ({
          ...period,
          incomePayment: this.toIncomePaymentRefResponse(
            period.incomePayment ?? null,
          ),
        })),
      );
  }

  async findPaymentPeriodById(periodId: string) {
    const period = await this.paymentPeriods
      .createQueryBuilder('period')
      .leftJoinAndSelect('period.plan', 'plan')
      .leftJoinAndSelect('period.incomePayment', 'incomePayment')
      .leftJoinAndSelect('incomePayment.account', 'account')
      .leftJoinAndSelect('period.items', 'items')
      .leftJoinAndSelect('items.category', 'category')
      .leftJoinAndSelect('items.accountEntity', 'accountEntity')
      .where('period.id = :periodId', { periodId })
      .orderBy('items.date', 'ASC')
      .getOne();

    if (!period)
      throw new NotFoundException(`Payment period ${periodId} was not found`);
    return this.attachPaymentPeriodReferences(
      period,
      await this.loadPlanReferenceMaps(period.plan.id),
    );
  }

  async createPaymentPeriod(planId: string, dto: CreatePaymentPeriodDto) {
    const plan = await this.findPlanEntity(planId);
    const incomePayment = dto.incomePaymentId
      ? await this.findIncomePaymentEntity(dto.incomePaymentId)
      : null;
    return this.paymentPeriods.save(
      this.paymentPeriods.create({
        plan,
        incomePayment,
        externalId: dto.externalId,
        incomeDate: dto.incomeDate,
      }),
    );
  }

  async updatePaymentPeriod(periodId: string, dto: UpdatePaymentPeriodDto) {
    const period = await this.findPaymentPeriodEntity(periodId);
    const incomePayment = dto.incomePaymentId
      ? await this.findIncomePaymentEntity(dto.incomePaymentId)
      : period.incomePayment;
    Object.assign(period, { ...dto, incomePayment });
    return this.paymentPeriods.save(period);
  }

  async deletePaymentPeriod(periodId: string) {
    const period = await this.findPaymentPeriodEntity(periodId);
    await this.paymentPeriods.remove(period);
    return { deleted: true };
  }

  async findPaymentPeriodItems(periodId: string) {
    const items = await this.paymentPeriodItems.find({
      where: { paymentPeriod: { id: periodId } },
      relations: { paymentPeriod: { plan: true }, category: true },
      order: { date: 'ASC' },
    });
    if (!items.length) return items;
    const references = await this.loadPlanReferenceMaps(
      items[0].paymentPeriod.plan.id,
    );
    return items.map((item) =>
      this.attachPaymentPeriodItemReferences(item, references),
    );
  }

  async findPaymentPeriodItemById(itemId: string) {
    const item = await this.paymentPeriodItems.findOne({
      where: { id: itemId },
      relations: { paymentPeriod: { plan: true }, category: true },
    });
    if (!item)
      throw new NotFoundException(
        `Payment period item ${itemId} was not found`,
      );
    return this.attachPaymentPeriodItemReferences(
      item,
      await this.loadPlanReferenceMaps(item.paymentPeriod.plan.id),
    );
  }

  async createPaymentPeriodItem(
    periodId: string,
    dto: CreatePaymentPeriodItemDto,
  ) {
    const paymentPeriod = await this.findPaymentPeriodEntity(periodId);
    const category = dto.categoryId
      ? await this.findCategoryEntity(paymentPeriod.plan.id, dto.categoryId)
      : null;
    const entity = this.paymentPeriodItems.create({
      paymentPeriod,
      category,
      externalId: dto.externalId,
      date: dto.date,
      concept: dto.concept,
      plannedAmount: dto.plannedAmount,
      actualAmount: dto.actualAmount ?? null,
      account: dto.account,
      fundingAccount: dto.fundingAccount,
      status: dto.status ?? ItemStatus.Pending,
      notes: dto.notes,
    });
    const item = await this.paymentPeriodItems.save(entity);
    await this.recalculatePaymentPeriod(periodId, {
      paymentPeriods: this.paymentPeriods,
      incomePayments: this.incomePayments,
    });
    const savedItem = await this.paymentPeriodItems.findOne({
      where: { id: item.id },
      relations: { category: true, paymentPeriod: { plan: true } },
    });
    if (!savedItem)
      throw new NotFoundException(
        `Payment period item ${item.id} was not found after save`,
      );
    return this.attachPaymentPeriodItemReferences(
      savedItem,
      await this.loadPlanReferenceMaps(paymentPeriod.plan.id),
    );
  }

  async updatePaymentPeriodItem(
    itemId: string,
    dto: UpdatePaymentPeriodItemDto,
  ) {
    const item = await this.findPaymentPeriodItemEntity(itemId);
    const category = await this.resolveCategoryById(
      item.paymentPeriod.plan.id,
      dto.categoryId,
    );
    if (category !== undefined) {
      item.category = category;
    }
    if (dto.externalId !== undefined) item.externalId = dto.externalId;
    if (dto.date !== undefined) item.date = dto.date;
    if (dto.concept !== undefined) item.concept = dto.concept;
    if (dto.plannedAmount !== undefined) item.plannedAmount = dto.plannedAmount;
    if (dto.actualAmount !== undefined) item.actualAmount = dto.actualAmount;
    if (dto.account !== undefined) item.account = dto.account;
    if (dto.fundingAccount !== undefined)
      item.fundingAccount = dto.fundingAccount;
    if (dto.status !== undefined) item.status = dto.status;
    if (dto.notes !== undefined) item.notes = dto.notes;
    const saved = await this.paymentPeriodItems.save(item);
    await this.recalculatePaymentPeriod(item.paymentPeriod.id, {
      paymentPeriods: this.paymentPeriods,
      incomePayments: this.incomePayments,
    });
    const savedItem = await this.paymentPeriodItems.findOne({
      where: { id: saved.id },
      relations: { category: true, paymentPeriod: { plan: true } },
    });
    if (!savedItem)
      throw new NotFoundException(
        `Payment period item ${saved.id} was not found after save`,
      );
    return this.attachPaymentPeriodItemReferences(
      savedItem,
      await this.loadPlanReferenceMaps(item.paymentPeriod.plan.id),
    );
  }

  async completePaymentPeriodItem(
    itemId: string,
    dto: CompletePaymentPeriodItemDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const itemRepo = manager.getRepository(PaymentPeriodItemEntity);
      const accountRepo = manager.getRepository(AccountEntity);
      const periodRepo = manager.getRepository(PaymentPeriodEntity);
      const incomePaymentRepo = manager.getRepository(IncomePaymentEntity);

      const item = await itemRepo.findOne({
        where: { id: itemId },
        relations: {
          paymentPeriod: { plan: true },
          accountEntity: true,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!item) {
        throw new NotFoundException(
          `Payment period item ${itemId} was not found`,
        );
      }

      const oldStatus = item.status;
      const wasAlreadyCompleted = oldStatus === ItemStatus.Completed;

      // If was completed before, reverse the old balance effect first
      if (wasAlreadyCompleted) {
        const oldAccount = item.accountEntity;
        const oldAmount = item.actualAmount ?? 0;

        if (oldAccount && oldAmount > 0) {
          oldAccount.balance = roundMoney(oldAccount.balance + oldAmount);
          await accountRepo.save(oldAccount);
        }
      }

      // Determine account to use for THIS completion
      let targetAccount = item.accountEntity;

      if (dto.accountId) {
        const foundAccount = await accountRepo.findOne({
          where: {
            id: dto.accountId,
            plan: { id: item.paymentPeriod.plan.id },
          },
        });

        if (!foundAccount) {
          throw new NotFoundException(
            `Account ${dto.accountId} was not found in this plan`,
          );
        }

        item.accountEntity = foundAccount;
        targetAccount = foundAccount;
      }

      if (!targetAccount) {
        throw new BadRequestException(
          'An account is required to complete a payment item. ' +
            'Provide accountId or link an account to the item first.',
        );
      }

      // Subtract actual amount from account balance
      targetAccount.balance = roundMoney(
        targetAccount.balance - dto.actualAmount,
      );
      await accountRepo.save(targetAccount);

      // Update item
      item.status = ItemStatus.Completed;
      item.actualAmount = dto.actualAmount;
      item.notes = dto.notes ?? item.notes;
      item.completedAt = new Date();

      const saved = await itemRepo.save(item);

      // Recalculate period totals
      await this.recalculatePaymentPeriod(item.paymentPeriod.id, {
        paymentPeriods: periodRepo,
        incomePayments: incomePaymentRepo,
      });

      return this.attachPaymentPeriodItemReferences(
        saved,
        await this.loadPlanReferenceMaps(item.paymentPeriod.plan.id),
      );
    });
  }

  async deletePaymentPeriodItem(itemId: string) {
    const item = await this.findPaymentPeriodItemEntity(itemId);
    const periodId = item.paymentPeriod.id;
    await this.paymentPeriodItems.remove(item);
    await this.recalculatePaymentPeriod(periodId, {
      paymentPeriods: this.paymentPeriods,
      incomePayments: this.incomePayments,
    });
    return { deleted: true };
  }

  private async recalculatePaymentPeriod(
    periodId: string,
    repos: {
      paymentPeriods: Repository<PaymentPeriodEntity>;
      incomePayments: Repository<IncomePaymentEntity>;
    },
  ) {
    const period = await repos.paymentPeriods.findOne({
      where: { id: periodId },
      relations: { items: true, incomePayment: true },
    });
    if (!period) return;
    const plannedTotal = (period.items ?? [])
      .filter((item) => item.status !== ItemStatus.Cancelled)
      .reduce((sum, item) => sum + (item.plannedAmount ?? 0), 0);
    period.plannedTotal = roundMoney(plannedTotal);
    period.plannedRemaining = period.incomePayment
      ? roundMoney(period.incomePayment.amount - plannedTotal)
      : 0;
    await repos.paymentPeriods.save(period);
  }

  async findRecurringExpenses(planId: string) {
    const expenses = await this.recurringExpenses.find({
      where: { plan: { id: planId } },
      relations: { days: true },
      order: { concept: 'ASC' },
    });
    const references = await this.loadPlanReferenceMaps(planId);
    return expenses.map((expense) =>
      this.attachRecurringExpenseReferences(expense, references),
    );
  }

  async findRecurringExpenseList(planId: string) {
    this.logger.debugTrace('SERVICE IN findRecurringExpenseList', { planId });
    const expenses = await this.recurringExpenses.find({
      where: { plan: { id: planId } },
      relations: { days: true },
      order: { concept: 'ASC' },
    });
    return expenses.map((expense) => ({
      id: expense.id,
      concept: expense.concept,
      amount: expense.amount,
      frequency: expense.frequency,
      day: expense.day,
      account: expense.account,
      fundingAccount: expense.fundingAccount,
      category: expense.category,
      days: (expense.days ?? []).map((day) => ({ id: day.id, day: day.day })),
    }));
  }

  async findRecurringExpenseById(planId: string, recurringExpenseId: string) {
    const expense = await this.recurringExpenses.findOne({
      where: { id: recurringExpenseId, plan: { id: planId } },
      relations: { days: true, plan: true },
    });
    if (!expense)
      throw new NotFoundException(
        `Recurring expense ${recurringExpenseId} was not found`,
      );
    return this.attachRecurringExpenseReferences(
      expense,
      await this.loadPlanReferenceMaps(expense.plan.id),
    );
  }

  findCompletedItems(planId: string) {
    return this.completedItems.find({
      where: { plan: { id: planId } },
      order: { date: 'ASC' },
    });
  }

  async createRecurringExpense(planId: string, dto: CreateRecurringExpenseDto) {
    const plan = await this.findPlanEntity(planId);

    // Validate custom frequency
    if (dto.frequency === RecurringFrequency.Custom) {
      if (!dto.customIntervalUnit) {
        throw new BadRequestException(
          'customIntervalUnit is required when frequency is custom',
        );
      }
      if (dto.days) {
        if (dto.customIntervalUnit === RecurringCustomIntervalUnit.Month) {
          const invalidDays = dto.days.filter((d) => d < 1 || d > 31);
          if (invalidDays.length > 0) {
            throw new BadRequestException(
              `Invalid days for monthly interval: ${invalidDays.join(', ')}. Days must be between 1 and 31.`,
            );
          }
        } else if (
          dto.customIntervalUnit === RecurringCustomIntervalUnit.Week
        ) {
          const invalidDays = dto.days.filter((d) => d < 1 || d > 7);
          if (invalidDays.length > 0) {
            throw new BadRequestException(
              `Invalid days for weekly interval: ${invalidDays.join(', ')}. Days must be between 1 (Monday) and 7 (Sunday).`,
            );
          }
        }
      }
    }

    const { days, ...expenseDto } = dto;
    const expense = await this.recurringExpenses.save(
      this.recurringExpenses.create({ plan, ...expenseDto }),
    );
    if (days?.length) {
      await this.recurringExpenseDays.save(
        days.map((day) =>
          this.recurringExpenseDays.create({ recurringExpense: expense, day }),
        ),
      );
    }
    const savedExpense = await this.recurringExpenses.findOne({
      where: { id: expense.id },
      relations: { days: true },
    });
    return this.attachRecurringExpenseReferences(
      savedExpense,
      await this.loadPlanReferenceMaps(planId),
    );
  }

  async updateRecurringExpense(
    recurringExpenseId: string,
    dto: UpdateRecurringExpenseDto,
  ) {
    const expense = await this.findRecurringExpenseEntity(recurringExpenseId);

    // Validate custom frequency
    if (dto.frequency === RecurringFrequency.Custom) {
      if (!dto.customIntervalUnit) {
        throw new BadRequestException(
          'customIntervalUnit is required when frequency is custom',
        );
      }
      if (dto.days) {
        if (dto.customIntervalUnit === RecurringCustomIntervalUnit.Month) {
          const invalidDays = dto.days.filter((d) => d < 1 || d > 31);
          if (invalidDays.length > 0) {
            throw new BadRequestException(
              `Invalid days for monthly interval: ${invalidDays.join(', ')}. Days must be between 1 and 31.`,
            );
          }
        } else if (
          dto.customIntervalUnit === RecurringCustomIntervalUnit.Week
        ) {
          const invalidDays = dto.days.filter((d) => d < 1 || d > 7);
          if (invalidDays.length > 0) {
            throw new BadRequestException(
              `Invalid days for weekly interval: ${invalidDays.join(', ')}. Days must be between 1 (Monday) and 7 (Sunday).`,
            );
          }
        }
      }
    }

    const { days, ...expenseDto } = dto;
    Object.assign(expense, expenseDto);
    await this.recurringExpenses.save(expense);
    if (days) {
      await this.recurringExpenseDays.delete({
        recurringExpense: { id: expense.id },
      });
      await this.recurringExpenseDays.save(
        days.map((day) =>
          this.recurringExpenseDays.create({ recurringExpense: expense, day }),
        ),
      );
    }
    const savedExpense = await this.recurringExpenses.findOne({
      where: { id: expense.id },
      relations: { days: true },
    });
    return this.attachRecurringExpenseReferences(
      savedExpense,
      await this.loadPlanReferenceMaps(expense.plan.id),
    );
  }

  async deleteRecurringExpense(recurringExpenseId: string) {
    const expense = await this.findRecurringExpenseEntity(recurringExpenseId);
    await this.recurringExpenses.remove(expense);
    return { deleted: true };
  }

  async createCompletedItem(planId: string, dto: CreateCompletedItemDto) {
    const plan = await this.findPlanEntity(planId);
    return this.completedItems.save(
      this.completedItems.create({
        plan,
        ...dto,
        status: ItemStatus.Completed,
      }),
    );
  }

  private async findPlanEntity(planId: string) {
    const plan = await this.plans.findOneBy({ id: planId });
    if (!plan) {
      this.logger.warnTrace('SERVICE MISS findPlanEntity', { planId });
      throw new NotFoundException(`Plan ${planId} was not found`);
    }
    return plan;
  }

  private async findAccountEntity(accountId: string) {
    const account = await this.accounts.findOneBy({ id: accountId });
    if (!account)
      throw new NotFoundException(`Account ${accountId} was not found`);
    return account;
  }

  private async findCategoryEntity(planId: string, categoryId: string) {
    const category = await this.categories.findOne({
      where: { id: categoryId, plan: { id: planId } },
    });
    if (!category)
      throw new NotFoundException(`Category ${categoryId} was not found`);
    return category;
  }

  private async resolveCategoryById(
    planId: string,
    categoryId: string | null | undefined,
  ): Promise<AllocationCategoryEntity | null | undefined> {
    if (categoryId === undefined) return undefined; // leave unchanged
    if (categoryId === null) return null;
    return this.findCategoryEntity(planId, categoryId);
  }

  private async findIncomePaymentEntity(incomePaymentId: string) {
    const payment = await this.incomePayments.findOne({
      where: { id: incomePaymentId },
      relations: { plan: true, account: true },
    });
    if (!payment) {
      throw new NotFoundException(
        `Income payment ${incomePaymentId} was not found`,
      );
    }
    return payment;
  }

  private async findPaymentPeriodEntity(periodId: string) {
    const period = await this.paymentPeriods.findOne({
      where: { id: periodId },
      relations: { plan: true, incomePayment: true },
    });
    if (!period)
      throw new NotFoundException(`Payment period ${periodId} was not found`);
    return period;
  }

  private async findPaymentPeriodItemEntity(itemId: string) {
    const item = await this.paymentPeriodItems.findOne({
      where: { id: itemId },
      relations: { paymentPeriod: { plan: true } },
    });
    if (!item)
      throw new NotFoundException(
        `Payment period item ${itemId} was not found`,
      );
    return item;
  }

  private async findRecurringExpenseEntity(recurringExpenseId: string) {
    const expense = await this.recurringExpenses.findOne({
      where: { id: recurringExpenseId },
      relations: { plan: true },
    });
    if (!expense)
      throw new NotFoundException(
        `Recurring expense ${recurringExpenseId} was not found`,
      );
    return expense;
  }

  private attachPaymentPeriodReferences(
    period: PaymentPeriodEntity,
    references: PlanReferenceMaps,
  ) {
    const periodData = { ...period } as Record<string, unknown>;
    delete periodData.plan;
    delete periodData.items;
    return {
      ...periodData,
      incomePayment: period.incomePayment
        ? this.buildIncomePaymentResponse(period.incomePayment)
        : null,
      items: (period.items ?? []).map((item) =>
        this.attachPaymentPeriodItemReferences(item, references),
      ),
    };
  }

  private attachPaymentPeriodItemReferences(
    item: PaymentPeriodItemEntity,
    references: PlanReferenceMaps,
  ) {
    const itemData = { ...item } as Record<string, unknown>;
    delete itemData.paymentPeriod;
    delete itemData.category;
    return {
      ...itemData,
      categoryId: item.category?.id ?? null,
      category: item.category
        ? {
            id: item.category.id,
            key: item.category.key,
            name: item.category.name,
            idealPercentage: item.category.idealPercentage,
          }
        : null,
      accountId: this.lookupAccountId(item.account, references),
      fundingAccountId: this.lookupAccountId(item.fundingAccount, references),
    };
  }

  private attachRecurringExpenseReferences(
    expense: RecurringExpenseEntity | null,
    references: PlanReferenceMaps,
  ) {
    if (!expense) return null;
    const expenseData = { ...expense } as Record<string, unknown>;
    delete expenseData.plan;
    delete expenseData.days;
    return {
      ...expenseData,
      days: (expense.days ?? []).map((day) => ({ id: day.id, day: day.day })),
      categoryId: this.lookupCategoryId(expense.category, references),
      accountId: this.lookupAccountId(expense.account, references),
      fundingAccountId: this.lookupAccountId(
        expense.fundingAccount,
        references,
      ),
    };
  }

  private async loadPlanReferenceMaps(planId: string) {
    const [accounts, categories] = await Promise.all([
      this.accounts.find({ where: { plan: { id: planId } } }),
      this.categories.find({ where: { plan: { id: planId } } }),
    ]);
    return this.buildPlanReferenceMaps(accounts, categories);
  }

  private buildPlanReferenceMaps(
    accounts: AccountEntity[],
    categories: AllocationCategoryEntity[],
  ): PlanReferenceMaps {
    return {
      accountIdsByName: new Map(
        accounts.map((account) => [account.name, account.id]),
      ),
      categoryIdsByKey: new Map(
        categories.flatMap((category) => [
          [category.key, category.id] as const,
          [category.name, category.id] as const,
        ]),
      ),
    };
  }

  private lookupAccountId(
    accountName: string | null | undefined,
    references: PlanReferenceMaps,
  ) {
    return accountName
      ? (references.accountIdsByName.get(accountName) ?? null)
      : null;
  }

  private lookupCategoryId(
    categoryKey: string | null | undefined,
    references: PlanReferenceMaps,
  ) {
    return categoryKey
      ? (references.categoryIdsByKey.get(categoryKey) ?? null)
      : null;
  }
}

type PlanReferenceMaps = {
  accountIdsByName: Map<string, string>;
  categoryIdsByKey: Map<string, string>;
};

function parseIsoDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
