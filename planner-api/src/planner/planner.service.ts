import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, IsNull } from 'typeorm';

import {
  CreateAccountDto,
  CreateBalanceSnapshotDto,
  CreateBudgetItemDto,
  CreateBudgetPeriodDto,
  CreateCategoryDto,
  CreateDebtProjectionRunDto,
  CreateIncomePaymentDto,
  CreateIncomeScheduleAmountRuleDto,
  CreateIncomeScheduleDto,
  CreateIncomeSourceDto,
  CreatePlanDto,
  CreateRecurringItemDto,
  CreateSummaryNoteDto,
  CreateTransactionDto,
  FulfillBudgetItemDto,
  UpdateAccountDto,
  UpdateBudgetItemDto,
  UpdateBudgetPeriodDto,
  UpdateCategoryDto,
  UpdateIncomePaymentDto,
  UpdatePlanDto,
  UpdateRecurringItemDto,
  UpsertPlanSettingDto,
} from './dto';
import {
  AccountBalanceSnapshotEntity,
  AllocationCategoryEntity,
  BudgetItemEntity,
  BudgetItemStatus,
  BudgetItemTransactionEntity,
  BudgetPeriodEntity,
  BudgetPeriodStatus,
  DebtProjectionRunEntity,
  FinancialAccountEntity,
  FinancialAccountStatus,
  FinancialPlanEntity,
  IncomePaymentEntity,
  IncomePaymentStatus,
  IncomeScheduleAmountRuleEntity,
  IncomeScheduleEntity,
  IncomeSourceEntity,
  PlanSettingEntity,
  PlanStatus,
  RecurringItemEntity,
  RolloverPolicy,
  SnapshotSource,
  SummaryNoteEntity,
  TransactionEntity,
  TransactionEntryEntity,
  TransactionStatus,
} from './entities';

@Injectable()
export class PlannerService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // =========================================================================
  // PLAN OPERATIONS
  // =========================================================================

  async createPlan(dto: CreatePlanDto): Promise<FinancialPlanEntity> {
    const repo = this.dataSource.getRepository(FinancialPlanEntity);
    const plan = repo.create({
      ...dto,
      status: dto.status ?? PlanStatus.Active,
    });
    return repo.save(plan);
  }

  async listPlans(): Promise<FinancialPlanEntity[]> {
    return this.dataSource.getRepository(FinancialPlanEntity).find({
      order: { createdAt: 'DESC' },
    });
  }

  async getPlan(planId: string): Promise<FinancialPlanEntity> {
    const plan = await this.dataSource
      .getRepository(FinancialPlanEntity)
      .findOne({
        where: { id: planId },
      });
    if (!plan) {
      throw new NotFoundException(`Plan ${planId} not found`);
    }
    return plan;
  }

  async updatePlan(
    planId: string,
    dto: UpdatePlanDto,
  ): Promise<FinancialPlanEntity> {
    const repo = this.dataSource.getRepository(FinancialPlanEntity);
    const plan = await this.getPlan(planId);
    Object.assign(plan, dto);
    return repo.save(plan);
  }

  async deletePlan(planId: string): Promise<void> {
    const result = await this.dataSource
      .getRepository(FinancialPlanEntity)
      .delete(planId);
    if (result.affected === 0) {
      throw new NotFoundException(`Plan ${planId} not found`);
    }
  }

  // =========================================================================
  // CATEGORY OPERATIONS
  // =========================================================================

  async createCategory(
    planId: string,
    dto: CreateCategoryDto,
  ): Promise<AllocationCategoryEntity> {
    await this.getPlan(planId);

    // Validate total percentage
    await this.validateCategoryPercentages(planId, dto.idealPercentageBps);

    const repo = this.dataSource.getRepository(AllocationCategoryEntity);
    const category = repo.create({
      ...dto,
      planId,
    });
    return repo.save(category);
  }

  async listCategories(planId: string): Promise<AllocationCategoryEntity[]> {
    await this.getPlan(planId);
    return this.dataSource.getRepository(AllocationCategoryEntity).find({
      where: { planId, archivedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  async updateCategory(
    planId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<AllocationCategoryEntity> {
    const repo = this.dataSource.getRepository(AllocationCategoryEntity);
    const category = await repo.findOne({
      where: { id: categoryId, planId },
    });
    if (!category) {
      throw new NotFoundException(
        `Category ${categoryId} not found in plan ${planId}`,
      );
    }

    if (dto.idealPercentageBps !== undefined) {
      await this.validateCategoryPercentages(
        planId,
        dto.idealPercentageBps,
        categoryId,
      );
    }

    Object.assign(category, dto);
    return repo.save(category);
  }

  async archiveCategory(planId: string, categoryId: string): Promise<void> {
    const repo = this.dataSource.getRepository(AllocationCategoryEntity);
    const category = await repo.findOne({
      where: { id: categoryId, planId },
    });
    if (!category) {
      throw new NotFoundException(
        `Category ${categoryId} not found in plan ${planId}`,
      );
    }
    category.archivedAt = new Date();
    await repo.save(category);
  }

  async restoreCategory(planId: string, categoryId: string): Promise<void> {
    const repo = this.dataSource.getRepository(AllocationCategoryEntity);
    const category = await repo.findOne({
      where: { id: categoryId, planId },
    });
    if (!category) {
      throw new NotFoundException(
        `Category ${categoryId} not found in plan ${planId}`,
      );
    }
    category.archivedAt = null;
    await repo.save(category);
  }

  private async validateCategoryPercentages(
    planId: string,
    newBps: number,
    excludeId?: string,
  ): Promise<void> {
    const repo = this.dataSource.getRepository(AllocationCategoryEntity);
    const query = repo
      .createQueryBuilder('cat')
      .where('cat.planId = :planId', { planId })
      .andWhere('cat.archivedAt IS NULL');

    if (excludeId) {
      query.andWhere('cat.id != :excludeId', { excludeId });
    }

    const categories = await query.getMany();
    const totalBps =
      categories.reduce((sum, cat) => sum + cat.idealPercentageBps, 0) + newBps;

    if (totalBps > 10000) {
      throw new BadRequestException(
        `Total idealPercentageBps cannot exceed 10000 (100%). Current total: ${totalBps}`,
      );
    }
  }

  // =========================================================================
  // ACCOUNT OPERATIONS
  // =========================================================================

  async createAccount(
    planId: string,
    dto: CreateAccountDto,
  ): Promise<FinancialAccountEntity> {
    await this.getPlan(planId);

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(FinancialAccountEntity);
      const account = repo.create({
        name: dto.name,
        accountType: dto.accountType,
        currency: dto.currency ?? 'MXN',
        status: FinancialAccountStatus.Active,
        planId,
        externalSource: dto.externalSource,
        externalId: dto.externalId,
      });
      const saved = await repo.save(account);

      // Create opening balance snapshot if provided
      if (
        dto.openingBalanceCents !== undefined &&
        dto.openingBalanceCents !== null
      ) {
        const snapRepo = manager.getRepository(AccountBalanceSnapshotEntity);
        await snapRepo.save(
          snapRepo.create({
            accountId: saved.id,
            observedAt: dto.openingBalanceObservedAt
              ? new Date(dto.openingBalanceObservedAt)
              : new Date(),
            balanceCents: dto.openingBalanceCents,
            source: SnapshotSource.Manual,
          }),
        );
      }

      const created = await manager
        .getRepository(FinancialAccountEntity)
        .findOne({
          where: { id: saved.id },
        });
      if (!created) {
        throw new NotFoundException(
          `Account ${saved.id} not found after creation`,
        );
      }
      return created;
    });
  }

  async listAccounts(planId: string): Promise<FinancialAccountEntity[]> {
    await this.getPlan(planId);
    return this.dataSource.getRepository(FinancialAccountEntity).find({
      where: { planId, status: FinancialAccountStatus.Active },
      order: { createdAt: 'ASC' },
    });
  }

  async getAccount(
    planId: string,
    accountId: string,
  ): Promise<FinancialAccountEntity> {
    await this.getPlan(planId);
    const account = await this.dataSource
      .getRepository(FinancialAccountEntity)
      .findOne({
        where: { id: accountId, planId },
      });
    if (!account) {
      throw new NotFoundException(
        `Account ${accountId} not found in plan ${planId}`,
      );
    }
    return account;
  }

  async updateAccount(
    planId: string,
    accountId: string,
    dto: UpdateAccountDto,
  ): Promise<FinancialAccountEntity> {
    const repo = this.dataSource.getRepository(FinancialAccountEntity);
    const account = await repo.findOne({
      where: { id: accountId, planId },
    });
    if (!account) {
      throw new NotFoundException(
        `Account ${accountId} not found in plan ${planId}`,
      );
    }
    Object.assign(account, dto);
    return repo.save(account);
  }

  async archiveAccount(planId: string, accountId: string): Promise<void> {
    const repo = this.dataSource.getRepository(FinancialAccountEntity);
    const account = await repo.findOne({
      where: { id: accountId, planId },
    });
    if (!account) {
      throw new NotFoundException(
        `Account ${accountId} not found in plan ${planId}`,
      );
    }
    account.status = FinancialAccountStatus.Archived;
    account.archivedAt = new Date();
    await repo.save(account);
  }

  async restoreAccount(planId: string, accountId: string): Promise<void> {
    const repo = this.dataSource.getRepository(FinancialAccountEntity);
    const account = await repo.findOne({
      where: { id: accountId, planId },
    });
    if (!account) {
      throw new NotFoundException(
        `Account ${accountId} not found in plan ${planId}`,
      );
    }
    account.status = FinancialAccountStatus.Active;
    account.archivedAt = null;
    await repo.save(account);
  }

  async createBalanceSnapshot(
    planId: string,
    accountId: string,
    dto: CreateBalanceSnapshotDto,
  ): Promise<AccountBalanceSnapshotEntity> {
    await this.getAccount(planId, accountId);
    const repo = this.dataSource.getRepository(AccountBalanceSnapshotEntity);
    const snapshot = repo.create({
      accountId,
      observedAt: new Date(),
      balanceCents: dto.balanceCents,
      source: dto.source ?? SnapshotSource.Manual,
    });
    return repo.save(snapshot);
  }

  async listBalanceSnapshots(
    planId: string,
    accountId: string,
  ): Promise<AccountBalanceSnapshotEntity[]> {
    await this.getAccount(planId, accountId);
    return this.dataSource.getRepository(AccountBalanceSnapshotEntity).find({
      where: { accountId },
      order: { observedAt: 'DESC' },
    });
  }

  async getCurrentBalance(
    planId: string,
    accountId: string,
  ): Promise<{
    accountId: string;
    balanceCents: number;
    lastSnapshotAt: string | null;
  }> {
    await this.getAccount(planId, accountId);

    // Get latest snapshot
    const snapRepo = this.dataSource.getRepository(
      AccountBalanceSnapshotEntity,
    );
    const latestSnapshot = await snapRepo.findOne({
      where: { accountId },
      order: { observedAt: 'DESC' },
    });

    let balanceCents = 0;
    let lastSnapshotAt: string | null = null;

    if (latestSnapshot) {
      balanceCents = latestSnapshot.balanceCents;
      lastSnapshotAt = latestSnapshot.observedAt.toISOString();
    }

    // Add transactions after snapshot by joining with transaction table
    const entryRepo = this.dataSource.getRepository(TransactionEntryEntity);
    const query = entryRepo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.transaction', 'transaction')
      .where('entry.accountId = :accountId', { accountId });

    if (latestSnapshot) {
      query.andWhere('transaction.occurredAt > :snapshotTime', {
        snapshotTime: latestSnapshot.observedAt,
      });
    }

    const entries = await query.getMany();
    for (const entry of entries) {
      balanceCents += entry.amountCents;
    }

    return {
      accountId,
      balanceCents,
      lastSnapshotAt,
    };
  }

  // =========================================================================
  // INCOME OPERATIONS
  // =========================================================================

  async createIncomeSource(
    planId: string,
    dto: CreateIncomeSourceDto,
  ): Promise<IncomeSourceEntity> {
    await this.getPlan(planId);
    const repo = this.dataSource.getRepository(IncomeSourceEntity);
    const source = repo.create({
      ...dto,
      planId,
      active: dto.active ?? true,
    });
    return repo.save(source);
  }

  async listIncomeSources(planId: string): Promise<IncomeSourceEntity[]> {
    await this.getPlan(planId);
    return this.dataSource.getRepository(IncomeSourceEntity).find({
      where: { planId },
      order: { createdAt: 'ASC' },
    });
  }

  async createIncomeSchedule(
    planId: string,
    incomeSourceId: string,
    dto: CreateIncomeScheduleDto,
  ): Promise<IncomeScheduleEntity> {
    await this.getPlan(planId);

    const source = await this.dataSource
      .getRepository(IncomeSourceEntity)
      .findOne({
        where: { id: incomeSourceId, planId },
      });
    if (!source) {
      throw new NotFoundException(
        `Income source ${incomeSourceId} not found in plan ${planId}`,
      );
    }

    const repo = this.dataSource.getRepository(IncomeScheduleEntity);
    const schedule = repo.create({
      ...dto,
      incomeSourceId,
      active: dto.active ?? true,
    });
    return repo.save(schedule);
  }

  async listIncomeSchedules(
    planId: string,
    incomeSourceId: string,
  ): Promise<IncomeScheduleEntity[]> {
    await this.getPlan(planId);

    const source = await this.dataSource
      .getRepository(IncomeSourceEntity)
      .findOne({
        where: { id: incomeSourceId, planId },
      });
    if (!source) {
      throw new NotFoundException(
        `Income source ${incomeSourceId} not found in plan ${planId}`,
      );
    }

    return this.dataSource.getRepository(IncomeScheduleEntity).find({
      where: { incomeSourceId },
      order: { createdAt: 'ASC' },
    });
  }

  async createIncomeScheduleAmountRule(
    planId: string,
    incomeSourceId: string,
    scheduleId: string,
    dto: CreateIncomeScheduleAmountRuleDto,
  ): Promise<IncomeScheduleAmountRuleEntity> {
    await this.getPlan(planId);

    const schedule = await this.dataSource
      .getRepository(IncomeScheduleEntity)
      .findOne({
        where: { id: scheduleId, incomeSourceId },
        relations: { incomeSource: true },
      });
    if (!schedule || schedule.incomeSource.planId !== planId) {
      throw new NotFoundException(
        `Schedule ${scheduleId} not found in plan ${planId}`,
      );
    }

    const repo = this.dataSource.getRepository(IncomeScheduleAmountRuleEntity);
    const rule = repo.create({
      ...dto,
      incomeScheduleId: scheduleId,
    });
    return repo.save(rule);
  }

  async createIncomePayment(
    planId: string,
    dto: CreateIncomePaymentDto,
  ): Promise<IncomePaymentEntity> {
    await this.getPlan(planId);

    const incomeSourceRepo = this.dataSource.getRepository(IncomeSourceEntity);
    const incomeSource = await incomeSourceRepo.findOne({
      where: { id: dto.incomeSourceId, planId },
    });
    if (!incomeSource) {
      throw new NotFoundException(
        `Income source ${dto.incomeSourceId} not found in plan ${planId}`,
      );
    }

    if (dto.incomeScheduleId) {
      const scheduleRepo = this.dataSource.getRepository(IncomeScheduleEntity);
      const schedule = await scheduleRepo.findOne({
        where: { id: dto.incomeScheduleId, incomeSourceId: dto.incomeSourceId },
      });
      if (!schedule) {
        throw new NotFoundException(
          `Income schedule ${dto.incomeScheduleId} not found for income source ${dto.incomeSourceId}`,
        );
      }
    }

    const repo = this.dataSource.getRepository(IncomePaymentEntity);
    const payment = repo.create({
      ...dto,
      status: dto.status ?? IncomePaymentStatus.Projected,
    });
    return repo.save(payment);
  }

  async listIncomePayments(planId: string): Promise<IncomePaymentEntity[]> {
    await this.getPlan(planId);
    return this.dataSource.getRepository(IncomePaymentEntity).find({
      where: { incomeSource: { planId } },
      relations: { incomeSource: true },
      order: { paidOn: 'DESC' },
    });
  }

  async getIncomePayment(
    planId: string,
    paymentId: string,
  ): Promise<IncomePaymentEntity> {
    await this.getPlan(planId);
    const payment = await this.dataSource
      .getRepository(IncomePaymentEntity)
      .findOne({
        where: { id: paymentId, incomeSource: { planId } },
        relations: { incomeSource: true },
      });
    if (!payment) {
      throw new NotFoundException(
        `Income payment ${paymentId} not found in plan ${planId}`,
      );
    }
    return payment;
  }

  async updateIncomePayment(
    planId: string,
    paymentId: string,
    dto: UpdateIncomePaymentDto,
  ): Promise<IncomePaymentEntity> {
    const repo = this.dataSource.getRepository(IncomePaymentEntity);
    const payment = await this.getIncomePayment(planId, paymentId);

    // Determine effective income source id after update
    const effectiveSourceId = dto.incomeSourceId ?? payment.incomeSourceId;

    // Validate incomeSourceId if provided
    if (dto.incomeSourceId !== undefined) {
      const incomeSourceRepo =
        this.dataSource.getRepository(IncomeSourceEntity);
      const incomeSource = await incomeSourceRepo.findOne({
        where: { id: dto.incomeSourceId, planId },
      });
      if (!incomeSource) {
        throw new NotFoundException(
          `Income source ${dto.incomeSourceId} not found in plan ${planId}`,
        );
      }
    }

    // Validate incomeScheduleId if provided and not null
    if (dto.incomeScheduleId !== undefined && dto.incomeScheduleId !== null) {
      const scheduleRepo = this.dataSource.getRepository(IncomeScheduleEntity);
      const schedule = await scheduleRepo.findOne({
        where: { id: dto.incomeScheduleId, incomeSourceId: effectiveSourceId },
      });
      if (!schedule) {
        throw new NotFoundException(
          `Income schedule ${dto.incomeScheduleId} not found for income source ${effectiveSourceId}`,
        );
      }
    }

    Object.assign(payment, dto);
    return repo.save(payment);
  }

  async deleteIncomePayment(planId: string, paymentId: string): Promise<void> {
    const payment = await this.getIncomePayment(planId, paymentId);
    const result = await this.dataSource
      .getRepository(IncomePaymentEntity)
      .delete(payment.id);
    if (result.affected === 0) {
      throw new NotFoundException(`Income payment ${paymentId} not found`);
    }
  }

  // =========================================================================
  // TRANSACTION OPERATIONS
  // =========================================================================

  async createTransaction(
    planId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionEntity> {
    await this.getPlan(planId);

    // Validate entries
    if (!dto.entries || dto.entries.length === 0) {
      throw new BadRequestException('Transaction must have at least one entry');
    }

    for (const entry of dto.entries) {
      if (!Number.isSafeInteger(entry.amountCents)) {
        throw new BadRequestException(
          'Entry amountCents must be a safe integer',
        );
      }
    }

    // Validate account plan ownership
    const accountIds = dto.entries.map((e) => e.accountId);
    const accounts = await this.dataSource
      .getRepository(FinancialAccountEntity)
      .find({
        where: { id: In(accountIds), planId },
      });
    if (accounts.length !== accountIds.length) {
      throw new BadRequestException(
        'All accounts must belong to the plan and be active',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(TransactionEntity);
      const entryRepo = manager.getRepository(TransactionEntryEntity);

      const transaction = txRepo.create({
        planId,
        occurredAt: new Date(dto.occurredAt),
        transactionType: dto.transactionType,
        description: dto.description,
        status: dto.status ?? TransactionStatus.Posted,
        categoryId: dto.categoryId,
        notes: dto.notes,
      });
      const saved = await txRepo.save(transaction);

      // Create entries
      for (const entryDto of dto.entries) {
        await entryRepo.save(
          entryRepo.create({
            transactionId: saved.id,
            accountId: entryDto.accountId,
            amountCents: entryDto.amountCents,
          }),
        );
      }

      const created = await manager.getRepository(TransactionEntity).findOne({
        where: { id: saved.id },
        relations: { entries: true },
      });
      if (!created) {
        throw new NotFoundException(
          `Transaction ${saved.id} not found after creation`,
        );
      }
      return created;
    });
  }

  async listTransactions(planId: string): Promise<TransactionEntity[]> {
    await this.getPlan(planId);
    return this.dataSource.getRepository(TransactionEntity).find({
      where: { planId },
      relations: { entries: true },
      order: { occurredAt: 'DESC' },
    });
  }

  // =========================================================================
  // BUDGET OPERATIONS
  // =========================================================================

  async createBudgetPeriod(
    planId: string,
    dto: CreateBudgetPeriodDto,
  ): Promise<BudgetPeriodEntity> {
    await this.getPlan(planId);
    const repo = this.dataSource.getRepository(BudgetPeriodEntity);
    const period = repo.create({
      ...dto,
      planId,
      status: dto.status ?? BudgetPeriodStatus.Open,
    });
    return repo.save(period);
  }

  async listBudgetPeriods(planId: string): Promise<BudgetPeriodEntity[]> {
    await this.getPlan(planId);
    return this.dataSource.getRepository(BudgetPeriodEntity).find({
      where: { planId },
      relations: { items: true },
      order: { startsOn: 'DESC' },
    });
  }

  async getBudgetPeriod(
    planId: string,
    periodId: string,
  ): Promise<BudgetPeriodEntity> {
    await this.getPlan(planId);
    const period = await this.dataSource
      .getRepository(BudgetPeriodEntity)
      .findOne({
        where: { id: periodId, planId },
        relations: { items: true },
      });
    if (!period) {
      throw new NotFoundException(
        `Budget period ${periodId} not found in plan ${planId}`,
      );
    }

    // Calculate plannedTotalCents and unallocatedCents
    const items = period.items || [];
    (period as any).plannedTotalCents = items.reduce(
      (sum, item) => sum + item.plannedAmountCents,
      0,
    );
    (period as any).unallocatedCents =
      period.fundingAmountCents - (period as any).plannedTotalCents;

    return period;
  }

  async updateBudgetPeriod(
    planId: string,
    periodId: string,
    dto: UpdateBudgetPeriodDto,
  ): Promise<BudgetPeriodEntity> {
    const repo = this.dataSource.getRepository(BudgetPeriodEntity);
    const period = await this.getBudgetPeriod(planId, periodId);
    Object.assign(period, dto);
    return repo.save(period);
  }

  async deleteBudgetPeriod(planId: string, periodId: string): Promise<void> {
    const result = await this.dataSource
      .getRepository(BudgetPeriodEntity)
      .delete(periodId);
    if (result.affected === 0) {
      throw new NotFoundException(`Budget period ${periodId} not found`);
    }
  }

  async createBudgetItem(
    planId: string,
    periodId: string,
    dto: CreateBudgetItemDto,
  ): Promise<BudgetItemEntity> {
    await this.getPlan(planId);

    const period = await this.dataSource
      .getRepository(BudgetPeriodEntity)
      .findOne({
        where: { id: periodId, planId },
      });
    if (!period) {
      throw new NotFoundException(
        `Budget period ${periodId} not found in plan ${planId}`,
      );
    }

    const repo = this.dataSource.getRepository(BudgetItemEntity);
    const item = repo.create({
      ...dto,
      budgetPeriodId: periodId,
      status: dto.status ?? BudgetItemStatus.Planned,
      rolloverPolicy: dto.rolloverPolicy ?? RolloverPolicy.Expire,
    });
    return repo.save(item);
  }

  async listBudgetItems(
    planId: string,
    periodId: string,
  ): Promise<BudgetItemEntity[]> {
    await this.getPlan(planId);

    const period = await this.dataSource
      .getRepository(BudgetPeriodEntity)
      .findOne({
        where: { id: periodId, planId },
      });
    if (!period) {
      throw new NotFoundException(
        `Budget period ${periodId} not found in plan ${planId}`,
      );
    }

    return this.dataSource.getRepository(BudgetItemEntity).find({
      where: { budgetPeriodId: periodId },
      order: { dueOn: 'ASC' },
    });
  }

  async getBudgetItem(
    planId: string,
    periodId: string,
    itemId: string,
  ): Promise<BudgetItemEntity> {
    await this.getPlan(planId);

    const period = await this.dataSource
      .getRepository(BudgetPeriodEntity)
      .findOne({
        where: { id: periodId, planId },
      });
    if (!period) {
      throw new NotFoundException(
        `Budget period ${periodId} not found in plan ${planId}`,
      );
    }

    const item = await this.dataSource.getRepository(BudgetItemEntity).findOne({
      where: { id: itemId, budgetPeriodId: periodId },
    });
    if (!item) {
      throw new NotFoundException(
        `Budget item ${itemId} not found in period ${periodId}`,
      );
    }
    return item;
  }

  async updateBudgetItem(
    planId: string,
    periodId: string,
    itemId: string,
    dto: UpdateBudgetItemDto,
  ): Promise<BudgetItemEntity> {
    const repo = this.dataSource.getRepository(BudgetItemEntity);
    const item = await this.getBudgetItem(planId, periodId, itemId);
    Object.assign(item, dto);
    return repo.save(item);
  }

  async deleteBudgetItem(
    planId: string,
    periodId: string,
    itemId: string,
  ): Promise<void> {
    const result = await this.dataSource
      .getRepository(BudgetItemEntity)
      .delete(itemId);
    if (result.affected === 0) {
      throw new NotFoundException(`Budget item ${itemId} not found`);
    }
  }

  async fulfillBudgetItem(
    planId: string,
    periodId: string,
    itemId: string,
    dto: FulfillBudgetItemDto,
  ): Promise<BudgetItemEntity> {
    await this.getPlan(planId);

    // Verify budget item exists and belongs to plan
    const item = await this.getBudgetItem(planId, periodId, itemId);

    // Verify transaction exists and belongs to plan
    const transaction = await this.dataSource
      .getRepository(TransactionEntity)
      .findOne({
        where: { id: dto.transactionId, planId },
      });
    if (!transaction) {
      throw new NotFoundException(
        `Transaction ${dto.transactionId} not found in plan ${planId}`,
      );
    }

    // Create or update budget item transaction (allocation)
    const bitRepo = this.dataSource.getRepository(BudgetItemTransactionEntity);
    let bit = await bitRepo.findOne({
      where: { budgetItemId: itemId, transactionId: dto.transactionId },
    });

    if (bit) {
      // Update existing allocation
      bit.allocatedAmountCents = dto.allocatedAmountCents;
    } else {
      // Create new allocation
      bit = bitRepo.create({
        budgetItemId: itemId,
        transactionId: dto.transactionId,
        allocatedAmountCents: dto.allocatedAmountCents,
      });
    }
    await bitRepo.save(bit);

    // Update budget item status to Completed
    item.status = BudgetItemStatus.Completed;
    return this.dataSource.getRepository(BudgetItemEntity).save(item);
  }

  // =========================================================================
  // RECURRING ITEM OPERATIONS
  // =========================================================================

  async createRecurringItem(
    planId: string,
    dto: CreateRecurringItemDto,
  ): Promise<RecurringItemEntity> {
    await this.getPlan(planId);
    const repo = this.dataSource.getRepository(RecurringItemEntity);
    const item = repo.create({
      ...dto,
      planId,
      active: dto.active ?? true,
    });
    return repo.save(item);
  }

  async listRecurringItems(planId: string): Promise<RecurringItemEntity[]> {
    await this.getPlan(planId);
    return this.dataSource.getRepository(RecurringItemEntity).find({
      where: { planId },
      order: { createdAt: 'ASC' },
    });
  }

  async getRecurringItem(
    planId: string,
    itemId: string,
  ): Promise<RecurringItemEntity> {
    await this.getPlan(planId);
    const item = await this.dataSource
      .getRepository(RecurringItemEntity)
      .findOne({
        where: { id: itemId, planId },
      });
    if (!item) {
      throw new NotFoundException(
        `Recurring item ${itemId} not found in plan ${planId}`,
      );
    }
    return item;
  }

  async updateRecurringItem(
    planId: string,
    itemId: string,
    dto: UpdateRecurringItemDto,
  ): Promise<RecurringItemEntity> {
    const repo = this.dataSource.getRepository(RecurringItemEntity);
    const item = await this.getRecurringItem(planId, itemId);
    Object.assign(item, dto);
    return repo.save(item);
  }

  async deleteRecurringItem(planId: string, itemId: string): Promise<void> {
    const result = await this.dataSource
      .getRepository(RecurringItemEntity)
      .delete(itemId);
    if (result.affected === 0) {
      throw new NotFoundException(`Recurring item ${itemId} not found`);
    }
  }

  async archiveRecurringItem(planId: string, itemId: string): Promise<void> {
    const repo = this.dataSource.getRepository(RecurringItemEntity);
    const item = await this.getRecurringItem(planId, itemId);
    item.active = false;
    await repo.save(item);
  }

  async restoreRecurringItem(planId: string, itemId: string): Promise<void> {
    const repo = this.dataSource.getRepository(RecurringItemEntity);
    const item = await this.getRecurringItem(planId, itemId);
    item.active = true;
    await repo.save(item);
  }

  // =========================================================================
  // DEBT PROJECTION OPERATIONS
  // =========================================================================

  async createDebtProjectionRun(
    planId: string,
    dto: CreateDebtProjectionRunDto,
  ): Promise<DebtProjectionRunEntity> {
    await this.getPlan(planId);
    const repo = this.dataSource.getRepository(DebtProjectionRunEntity);
    const run = repo.create({
      ...dto,
      planId,
      generatedAt: new Date(),
    });
    return repo.save(run);
  }

  async listDebtProjectionRuns(
    planId: string,
  ): Promise<DebtProjectionRunEntity[]> {
    await this.getPlan(planId);
    return this.dataSource.getRepository(DebtProjectionRunEntity).find({
      where: { planId },
      relations: { points: true },
      order: { generatedAt: 'DESC' },
    });
  }

  // =========================================================================
  // PLAN SETTINGS OPERATIONS
  // =========================================================================

  async upsertPlanSetting(
    planId: string,
    key: string,
    dto: UpsertPlanSettingDto,
  ): Promise<PlanSettingEntity> {
    await this.getPlan(planId);

    // Validate JSON
    try {
      JSON.parse(dto.valueJson);
    } catch {
      throw new BadRequestException('valueJson must be valid JSON');
    }

    const repo = this.dataSource.getRepository(PlanSettingEntity);
    let setting = await repo.findOne({
      where: { planId, key },
    });

    if (setting) {
      setting.valueJson = dto.valueJson;
    } else {
      setting = repo.create({
        planId,
        key,
        valueJson: dto.valueJson,
      });
    }

    return repo.save(setting);
  }

  async listPlanSettings(planId: string): Promise<PlanSettingEntity[]> {
    await this.getPlan(planId);
    return this.dataSource.getRepository(PlanSettingEntity).find({
      where: { planId },
    });
  }

  // =========================================================================
  // SUMMARY NOTE OPERATIONS
  // =========================================================================

  async createSummaryNote(
    planId: string,
    dto: CreateSummaryNoteDto,
  ): Promise<SummaryNoteEntity> {
    await this.getPlan(planId);
    const repo = this.dataSource.getRepository(SummaryNoteEntity);
    const note = repo.create({
      ...dto,
      planId,
    });
    return repo.save(note);
  }

  async listSummaryNotes(planId: string): Promise<SummaryNoteEntity[]> {
    await this.getPlan(planId);
    return this.dataSource.getRepository(SummaryNoteEntity).find({
      where: { planId },
      order: { createdAt: 'DESC' },
    });
  }

  // =========================================================================
  // DASHBOARD
  // =========================================================================

  async getDashboard(planId: string): Promise<any> {
    const plan = await this.getPlan(planId);
    const accounts = await this.listAccounts(planId);
    const categories = await this.listCategories(planId);

    const currentBalances: Array<{
      accountId: string;
      accountName: string;
      balanceCents: number;
      lastSnapshotAt: string | null;
    }> = [];
    for (const account of accounts) {
      const balance = await this.getCurrentBalance(planId, account.id);
      currentBalances.push({
        accountId: balance.accountId,
        accountName: account.name,
        balanceCents: balance.balanceCents,
        lastSnapshotAt: balance.lastSnapshotAt,
      });
    }

    const recentIncomePayments = await this.dataSource
      .getRepository(IncomePaymentEntity)
      .find({
        where: { incomeSource: { planId } },
        relations: { incomeSource: true },
        order: { paidOn: 'DESC' },
        take: 10,
      });

    const recentTransactions = await this.dataSource
      .getRepository(TransactionEntity)
      .find({
        where: { planId },
        relations: { entries: true },
        order: { occurredAt: 'DESC' },
        take: 10,
      });

    const recurringItems = await this.listRecurringItems(planId);

    return {
      plan,
      accounts,
      categories,
      currentBalances,
      recentIncomePayments,
      recentTransactions,
      recurringItems,
    };
  }
}
