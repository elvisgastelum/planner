import { readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

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
  ImportPlanJsonDto,
  UpdateAccountDto,
  UpdateAllocationCategoryDto,
  UpdateFinancialPlanDto,
  UpdateIncomePaymentDto,
  UpdateIncomeScheduleDto,
  UpdatePaymentPeriodDto,
  UpdatePaymentPeriodItemDto,
  UpdateRecurringExpenseDto,
} from './dto';
import {
  AccountEntity,
  AccountType,
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
  RecurringExpenseDayEntity,
  RecurringExpenseDayRule,
  RecurringExpenseEntity,
  RecurringFrequency,
  SummaryNoteEntity,
} from './entities';

type FinancialPlanJson = Record<string, any>;

@Injectable()
export class PlannerService {
  constructor(
    private readonly dataSource: DataSource,
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
    const plan = await this.plans.findOne({
      where: { id: planId },
      relations: {
        allocationCategories: true,
        accounts: true,
        incomeSchedule: { amountRules: true },
        incomePayments: true,
        paymentPeriods: { incomePayment: true, items: true },
        recurringExpenses: { days: true },
        completedItems: true,
        rules: true,
      },
    });
    if (!plan) throw new NotFoundException(`Plan ${planId} was not found`);
    const references = this.buildPlanReferenceMaps(
      plan.accounts,
      plan.allocationCategories,
    );

    return {
      ...plan,
      paymentPeriods: plan.paymentPeriods.map((period) =>
        this.attachPaymentPeriodReferences(period, references),
      ),
      recurringExpenses: plan.recurringExpenses.map((expense) =>
        this.attachRecurringExpenseReferences(expense, references),
      ),
    };
  }

  createPlan(dto: CreateFinancialPlanDto) {
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
    const plan = await this.findPlanEntity(planId);
    Object.assign(plan, dto);
    return this.plans.save(plan);
  }

  async deletePlan(planId: string) {
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

  async findCategories(planId: string) {
    await this.findPlanEntity(planId);
    return this.categories.find({
      where: { plan: { id: planId } },
      order: { key: 'ASC' },
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

  async generateIncomePayments(planId: string, through: string) {
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

  async deleteIncomePayment(incomePaymentId: string) {
    const payment = await this.findIncomePaymentEntity(incomePaymentId);
    await this.incomePayments.remove(payment);
    return { deleted: true };
  }

  findPaymentPeriods(planId: string) {
    return this.paymentPeriods.find({
      where: { plan: { id: planId } },
      relations: { incomePayment: true },
      order: { incomeDate: 'ASC' },
    });
  }

  async findPaymentPeriodById(periodId: string) {
    const period = await this.paymentPeriods.findOne({
      where: { id: periodId },
      relations: { plan: true, incomePayment: true, items: true },
    });
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
      relations: { paymentPeriod: { plan: true } },
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

  async createPaymentPeriodItem(
    periodId: string,
    dto: CreatePaymentPeriodItemDto,
  ) {
    const paymentPeriod = await this.findPaymentPeriodEntity(periodId);
    const item = await this.paymentPeriodItems.save(
      this.paymentPeriodItems.create({
        paymentPeriod,
        ...dto,
        actualAmount: dto.actualAmount ?? null,
        status: dto.status ?? ItemStatus.Pending,
      }),
    );
    await this.recalculatePaymentPeriod(periodId, {
      paymentPeriods: this.paymentPeriods,
      incomePayments: this.incomePayments,
    });
    return this.attachPaymentPeriodItemReferences(
      item,
      await this.loadPlanReferenceMaps(paymentPeriod.plan.id),
    );
  }

  async updatePaymentPeriodItem(
    itemId: string,
    dto: UpdatePaymentPeriodItemDto,
  ) {
    const item = await this.findPaymentPeriodItemEntity(itemId);
    Object.assign(item, dto);
    const saved = await this.paymentPeriodItems.save(item);
    await this.recalculatePaymentPeriod(item.paymentPeriod.id, {
      paymentPeriods: this.paymentPeriods,
      incomePayments: this.incomePayments,
    });
    return this.attachPaymentPeriodItemReferences(
      saved,
      await this.loadPlanReferenceMaps(item.paymentPeriod.plan.id),
    );
  }

  async completePaymentPeriodItem(
    itemId: string,
    dto: CompletePaymentPeriodItemDto,
  ) {
    const item = await this.findPaymentPeriodItemEntity(itemId);
    item.status = ItemStatus.Completed;
    item.actualAmount = dto.actualAmount;
    item.notes = dto.notes ?? item.notes;
    item.completedAt = new Date();
    const saved = await this.paymentPeriodItems.save(item);
    await this.recalculatePaymentPeriod(item.paymentPeriod.id, {
      paymentPeriods: this.paymentPeriods,
      incomePayments: this.incomePayments,
    });
    return this.attachPaymentPeriodItemReferences(
      saved,
      await this.loadPlanReferenceMaps(item.paymentPeriod.plan.id),
    );
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

  async createRecurringExpense(planId: string, dto: CreateRecurringExpenseDto) {
    const plan = await this.findPlanEntity(planId);
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

  async importPlanJson(dto: ImportPlanJsonDto) {
    const filePath = dto.path
      ? this.resolvePlanFilePath(dto.path)
      : join(process.cwd(), 'src', 'plan-financiero.json');
    const data = JSON.parse(
      await readFile(filePath, 'utf8'),
    ) as FinancialPlanJson;
    const metadata = data.metadata;
    return this.dataSource.transaction(async (manager) => {
      const repos = this.getImportRepositories(manager);

      await repos.plans.delete({ metadataId: metadata.id });

      const plan = await repos.plans.save(
        repos.plans.create({
          metadataId: metadata.id,
          schemaVersion: data.schema_version,
          name: metadata.name,
          currency: metadata.currency,
          startDate: metadata.start_date,
          endDate: metadata.end_date,
          status: metadata.status,
          objective: metadata.objective,
          projectedDebtFreeDate: data.summary?.projected_debt_free_date ?? null,
          projectedEmergencyFund:
            data.summary?.projected_emergency_fund_by_2026_08_14 ?? null,
        }),
      );

      await this.importAllocation(repos, plan, data.allocation ?? {});
      await this.importRules(repos, plan, data.rules ?? {});
      await this.importAccounts(repos, plan, data.accounts ?? []);
      await this.importCurrentState(repos, plan, data.current_state ?? {});
      await this.importCompletedItems(repos, plan, data.completed_items ?? []);
      await this.importPreIncomeAllocation(
        repos,
        plan,
        data.pre_income_allocation,
      );
      await this.importRecurringExpenses(
        repos,
        plan,
        data.recurring_expenses ?? [],
      );
      await this.importIncomeProjection(
        repos,
        plan,
        data.income_projection,
        data.rules?.income_schedule,
      );
      await this.importPaymentPeriods(repos, plan, data.payment_periods ?? []);
      await this.importDebtProjection(repos, plan, data.debt_projection ?? []);
      await this.importSummaryNotes(repos, plan, data.summary?.notes ?? []);

      return {
        id: plan.id,
        metadataId: plan.metadataId,
        imported: true,
        counts: {
          allocationCategories: Object.keys(data.allocation ?? {}).length,
          accounts: data.accounts?.length ?? 0,
          amountRules: Object.keys(
            data.rules?.income_schedule?.monthly_payment_amounts ?? {},
          ).length,
          completedItems: data.completed_items?.length ?? 0,
          currentAccountBalances: Object.keys(
            data.current_state?.cash_available ?? {},
          ).length,
          currentDebtBalances: Object.keys(data.current_state?.debts ?? {})
            .length,
          debtBalances:
            data.debt_projection?.reduce(
              (sum, snapshot) =>
                sum + Math.max(Object.keys(snapshot ?? {}).length - 1, 0),
              0,
            ) ?? 0,
          debtSnapshots: data.debt_projection?.length ?? 0,
          incomePayments: data.income_projection?.payments?.length ?? 0,
          incomeSchedules: data.rules?.income_schedule ? 1 : 0,
          paymentPeriodItems:
            data.payment_periods?.reduce(
              (sum, period) => sum + (period.items?.length ?? 0),
              0,
            ) ?? 0,
          paymentPeriods: data.payment_periods?.length ?? 0,
          preIncomeAllocationItems:
            data.pre_income_allocation?.items?.length ?? 0,
          recurringExpenseDays:
            data.recurring_expenses?.reduce(
              (sum, expense) => sum + (expense.days?.length ?? 0),
              0,
            ) ?? 0,
          recurringExpenses: data.recurring_expenses?.length ?? 0,
          rules: Object.keys(data.rules ?? {}).length,
          summaryNotes: data.summary?.notes?.length ?? 0,
        },
      };
    });
  }

  private async importAllocation(
    repos: ImportRepositories,
    plan: FinancialPlanEntity,
    allocation: Record<string, any>,
  ) {
    await repos.categories.save(
      Object.entries(allocation).map(([key, value]) =>
        repos.categories.create({
          plan,
          key,
          name: key,
          percentage: value.percentage,
          description: value.description,
        }),
      ),
    );
  }

  private async importRules(
    repos: ImportRepositories,
    plan: FinancialPlanEntity,
    rules: Record<string, unknown>,
  ) {
    await repos.rules.save(
      Object.entries(rules).map(([key, valueJson]) =>
        repos.rules.create({ plan, key, valueJson }),
      ),
    );
  }

  private async importAccounts(
    repos: ImportRepositories,
    plan: FinancialPlanEntity,
    accounts: any[],
  ) {
    await repos.accounts.save(
      accounts.map((account) =>
        repos.accounts.create({
          plan,
          externalId: account.id,
          name: account.name,
          type: account.type as AccountType,
        }),
      ),
    );
  }

  private async importCurrentState(
    repos: ImportRepositories,
    plan: FinancialPlanEntity,
    currentState: any,
  ) {
    const asOf = currentState.as_of ?? plan.startDate;
    await repos.currentAccountBalances.save(
      Object.entries(currentState.cash_available ?? {}).map(
        ([accountName, amount]) =>
          repos.currentAccountBalances.create({
            plan,
            asOf,
            accountName,
            amount: Number(amount),
            currency: plan.currency,
          }),
      ),
    );
    await repos.currentDebtBalances.save(
      Object.entries(currentState.debts ?? {}).map(([debtName, amount]) =>
        repos.currentDebtBalances.create({
          plan,
          asOf,
          debtName,
          amount: Number(amount),
          currency: plan.currency,
        }),
      ),
    );
  }

  private async importCompletedItems(
    repos: ImportRepositories,
    plan: FinancialPlanEntity,
    items: any[],
  ) {
    await repos.completedItems.save(
      items.map((item) =>
        repos.completedItems.create({
          plan,
          externalId: item.id,
          date: item.date,
          concept: item.concept,
          amount: item.amount,
          type: item.type ?? null,
          category: item.category ?? null,
          fromAccount: item.from_account ?? null,
          toAccount: item.to_account ?? null,
          account: item.account ?? null,
          status: item.status ?? ItemStatus.Completed,
        }),
      ),
    );
  }

  private async importPreIncomeAllocation(
    repos: ImportRepositories,
    plan: FinancialPlanEntity,
    allocation?: any,
  ) {
    if (!allocation) return;
    const entity = await repos.preIncomeAllocations.save(
      repos.preIncomeAllocations.create({
        plan,
        availableAmount: allocation.available_amount,
        periodEnd: allocation.period_end,
      }),
    );
    await repos.preIncomeAllocationItems.save(
      (allocation.items ?? []).map((item) =>
        repos.preIncomeAllocationItems.create({
          preIncomeAllocation: entity,
          externalId: item.id,
          date: item.date,
          concept: item.concept,
          amount: item.amount,
          category: item.category ?? null,
          account: item.account ?? null,
          status: item.status ?? ItemStatus.Pending,
          nonRollover: item.non_rollover ?? false,
        }),
      ),
    );
  }

  private async importRecurringExpenses(
    repos: ImportRepositories,
    plan: FinancialPlanEntity,
    expenses: any[],
  ) {
    for (const expense of expenses) {
      const entity = await repos.recurringExpenses.save(
        repos.recurringExpenses.create({
          plan,
          concept: expense.concept,
          amount: expense.amount,
          frequency: expense.frequency as RecurringFrequency,
          day: expense.day ?? null,
          date: expense.date ?? null,
          dayRule: (expense.day_rule as RecurringExpenseDayRule | null) ?? null,
          account: expense.account ?? null,
          fundingAccount: expense.funding_account ?? null,
          category: expense.category ?? null,
          nonRollover: expense.non_rollover ?? false,
          lastPaymentDate: expense.last_payment?.date ?? null,
          lastPaymentAmount: expense.last_payment?.amount ?? null,
        }),
      );
      if (expense.days?.length) {
        await repos.recurringExpenseDays.save(
          expense.days.map((day) =>
            repos.recurringExpenseDays.create({
              recurringExpense: entity,
              day,
            }),
          ),
        );
      }
    }
  }

  private async importIncomeProjection(
    repos: ImportRepositories,
    plan: FinancialPlanEntity,
    projection: any,
    scheduleRule: any,
  ) {
    if (scheduleRule) {
      const schedule = await repos.schedules.save(
        repos.schedules.create({
          plan,
          cadence: scheduleRule.cadence as IncomeCadence,
          anchorPaymentDate: scheduleRule.anchor_payment_date,
          currency: scheduleRule.currency ?? plan.currency,
          ordinaryMonthGrossIncome:
            scheduleRule.ordinary_month_gross_income ?? null,
          ordinaryMonthNetReference:
            scheduleRule.ordinary_month_net_reference ?? null,
          generatedThrough: projection?.generated_through ?? null,
          generationMethod:
            (projection?.generation_method as IncomeGenerationMethod | null) ??
            null,
          calculationRule: scheduleRule.calculation_rule ?? null,
        }),
      );
      await repos.amountRules.save(
        Object.entries(scheduleRule.monthly_payment_amounts ?? {}).map(
          ([key, amount]) =>
            repos.amountRules.create({
              incomeSchedule: schedule,
              paymentNumberInMonth: Number(key.replace('payment_', '')),
              amount: Number(amount),
              currency: schedule.currency,
            }),
        ),
      );
    }
    await repos.incomePayments.save(
      (projection?.payments ?? []).map((payment) =>
        repos.incomePayments.create({
          plan,
          externalId: payment.id,
          date: payment.date,
          month: payment.month,
          paymentNumberInMonth: payment.payment_number_in_month,
          amount: payment.amount,
          currency: payment.currency ?? plan.currency,
          status: payment.status ?? IncomeStatus.Projected,
          source: IncomeSource.Imported,
        }),
      ),
    );
  }

  private async importPaymentPeriods(
    repos: ImportRepositories,
    plan: FinancialPlanEntity,
    periods: any[],
  ) {
    for (const period of periods) {
      const incomePayment = period.income?.id
        ? await repos.incomePayments.findOne({
            where: { plan: { id: plan.id }, externalId: period.income.id },
          })
        : null;
      const periodEntity = await repos.paymentPeriods.save(
        repos.paymentPeriods.create({
          plan,
          incomePayment,
          externalId: period.id,
          incomeDate: period.income_date,
          plannedTotal: period.planned_total ?? 0,
          plannedRemaining: period.planned_remaining ?? 0,
        }),
      );
      await repos.paymentPeriodItems.save(
        (period.items ?? []).map((item) =>
          repos.paymentPeriodItems.create({
            paymentPeriod: periodEntity,
            externalId: item.id,
            date: item.date,
            concept: item.concept,
            plannedAmount: item.planned_amount,
            actualAmount: item.actual_amount ?? null,
            category: item.category ?? null,
            account: item.account ?? null,
            fundingAccount: item.funding_account ?? null,
            status: item.status ?? ItemStatus.Pending,
            completedAt: item.completed_at ? new Date(item.completed_at) : null,
            notes: item.notes ?? null,
            nonRollover: item.non_rollover ?? false,
            treatedAsSpentIfUnused: item.treated_as_spent_if_unused ?? false,
          }),
        ),
      );
      await this.recalculatePaymentPeriod(periodEntity.id, repos);
    }
  }

  private async importDebtProjection(
    repos: ImportRepositories,
    plan: FinancialPlanEntity,
    snapshots: any[],
  ) {
    for (const snapshot of snapshots) {
      const { date, ...balances } = snapshot;
      const entity = await repos.debtSnapshots.save(
        repos.debtSnapshots.create({ plan, date }),
      );
      await repos.debtBalances.save(
        Object.entries(balances).map(([accountName, amount]) =>
          repos.debtBalances.create({
            snapshot: entity,
            accountName,
            amount: Number(amount),
          }),
        ),
      );
    }
  }

  private async importSummaryNotes(
    repos: ImportRepositories,
    plan: FinancialPlanEntity,
    notes: string[],
  ) {
    await repos.summaryNotes.save(
      notes.map((note) => repos.summaryNotes.create({ plan, note })),
    );
  }

  private async recalculatePaymentPeriod(
    periodId: string,
    repos: Pick<ImportRepositories, 'paymentPeriods' | 'incomePayments'>,
  ) {
    const period = await repos.paymentPeriods.findOne({
      where: { id: periodId },
      relations: { incomePayment: true, items: true },
    });
    if (!period) return;
    period.plannedTotal = roundMoney(
      (period.items ?? []).reduce(
        (sum, item) => sum + Number(item.plannedAmount),
        0,
      ),
    );
    period.plannedRemaining = roundMoney(
      Number(period.incomePayment?.amount ?? 0) - period.plannedTotal,
    );
    await repos.paymentPeriods.save(period);
  }

  private getImportRepositories(manager: EntityManager): ImportRepositories {
    return {
      plans: manager.getRepository(FinancialPlanEntity),
      accounts: manager.getRepository(AccountEntity),
      categories: manager.getRepository(AllocationCategoryEntity),
      schedules: manager.getRepository(IncomeScheduleEntity),
      amountRules: manager.getRepository(IncomeScheduleAmountRuleEntity),
      incomePayments: manager.getRepository(IncomePaymentEntity),
      paymentPeriods: manager.getRepository(PaymentPeriodEntity),
      paymentPeriodItems: manager.getRepository(PaymentPeriodItemEntity),
      recurringExpenses: manager.getRepository(RecurringExpenseEntity),
      recurringExpenseDays: manager.getRepository(RecurringExpenseDayEntity),
      completedItems: manager.getRepository(CompletedItemEntity),
      preIncomeAllocations: manager.getRepository(PreIncomeAllocationEntity),
      preIncomeAllocationItems: manager.getRepository(
        PreIncomeAllocationItemEntity,
      ),
      currentAccountBalances: manager.getRepository(
        CurrentAccountBalanceEntity,
      ),
      currentDebtBalances: manager.getRepository(CurrentDebtBalanceEntity),
      debtSnapshots: manager.getRepository(DebtProjectionSnapshotEntity),
      debtBalances: manager.getRepository(DebtProjectionBalanceEntity),
      rules: manager.getRepository(PlanRuleEntity),
      summaryNotes: manager.getRepository(SummaryNoteEntity),
    };
  }

  private resolvePlanFilePath(requestedPath: string) {
    const absolutePath = resolve(process.cwd(), requestedPath);
    const relativePath = relative(process.cwd(), absolutePath);

    if (relativePath.startsWith('..')) {
      throw new BadRequestException(
        'Import file path must stay within the project directory',
      );
    }

    return absolutePath;
  }

  private async findPlanEntity(planId: string) {
    const plan = await this.plans.findOneBy({ id: planId });
    if (!plan) throw new NotFoundException(`Plan ${planId} was not found`);
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

  private async findIncomePaymentEntity(incomePaymentId: string) {
    const payment = await this.incomePayments.findOneBy({
      id: incomePaymentId,
    });
    if (!payment)
      throw new NotFoundException(
        `Income payment ${incomePaymentId} was not found`,
      );
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
    return {
      ...period,
      items: (period.items ?? []).map((item) =>
        this.attachPaymentPeriodItemReferences(item, references),
      ),
    };
  }

  private attachPaymentPeriodItemReferences(
    item: PaymentPeriodItemEntity,
    references: PlanReferenceMaps,
  ) {
    return {
      ...item,
      categoryId: this.lookupCategoryId(item.category, references),
      accountId: this.lookupAccountId(item.account, references),
      fundingAccountId: this.lookupAccountId(item.fundingAccount, references),
    };
  }

  private attachRecurringExpenseReferences(
    expense: RecurringExpenseEntity | null,
    references: PlanReferenceMaps,
  ) {
    if (!expense) return null;
    return {
      ...expense,
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

type ImportRepositories = {
  plans: Repository<FinancialPlanEntity>;
  accounts: Repository<AccountEntity>;
  categories: Repository<AllocationCategoryEntity>;
  schedules: Repository<IncomeScheduleEntity>;
  amountRules: Repository<IncomeScheduleAmountRuleEntity>;
  incomePayments: Repository<IncomePaymentEntity>;
  paymentPeriods: Repository<PaymentPeriodEntity>;
  paymentPeriodItems: Repository<PaymentPeriodItemEntity>;
  recurringExpenses: Repository<RecurringExpenseEntity>;
  recurringExpenseDays: Repository<RecurringExpenseDayEntity>;
  completedItems: Repository<CompletedItemEntity>;
  preIncomeAllocations: Repository<PreIncomeAllocationEntity>;
  preIncomeAllocationItems: Repository<PreIncomeAllocationItemEntity>;
  currentAccountBalances: Repository<CurrentAccountBalanceEntity>;
  currentDebtBalances: Repository<CurrentDebtBalanceEntity>;
  debtSnapshots: Repository<DebtProjectionSnapshotEntity>;
  debtBalances: Repository<DebtProjectionBalanceEntity>;
  rules: Repository<PlanRuleEntity>;
  summaryNotes: Repository<SummaryNoteEntity>;
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
