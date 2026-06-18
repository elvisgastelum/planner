import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { PlannerService } from './planner.service';
import { SnapshotSource } from './entities';

import {
  CreatePlanDto,
  UpdatePlanDto,
  PlanResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CreateAccountDto,
  UpdateAccountDto,
  AccountResponseDto,
  BalanceSnapshotResponseDto,
  CurrentBalanceResponseDto,
  CreateIncomeSourceDto,
  UpdateIncomeSourceDto,
  IncomeSourceResponseDto,
  CreateIncomeScheduleDto,
  UpdateIncomeScheduleDto,
  IncomeScheduleResponseDto,
  CreateIncomeScheduleAmountRuleDto,
  UpdateIncomeScheduleAmountRuleDto,
  IncomeScheduleAmountRuleResponseDto,
  CreateIncomePaymentDto,
  UpdateIncomePaymentDto,
  IncomePaymentResponseDto,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionResponseDto,
  CreateBudgetPeriodDto,
  UpdateBudgetPeriodDto,
  BudgetPeriodResponseDto,
  CreateBudgetItemDto,
  UpdateBudgetItemDto,
  BudgetItemResponseDto,
  CreateRecurringItemDto,
  UpdateRecurringItemDto,
  RecurringItemResponseDto,
  CreateDebtProjectionRunDto,
  DebtProjectionRunResponseDto,
  UpsertPlanSettingDto,
  PlanSettingResponseDto,
  CreateSummaryNoteDto,
  UpdateSummaryNoteDto,
  SummaryNoteResponseDto,
  DashboardResponseDto,
  IdResponseDto,
} from './dto';

@ApiTags('plans')
@Controller('')
export class PlannerController {
  constructor(private readonly service: PlannerService) {}

  // =========================================================================
  // FINANCIAL PLANS
  // =========================================================================

  @Post('/')
  @ApiOperation({ summary: 'Create a financial plan' })
  @ApiResponse({ status: 201, type: PlanResponseDto })
  async createPlan(@Body() dto: CreatePlanDto): Promise<PlanResponseDto> {
    const plan = await this.service.createPlan(dto);
    return this.toPlanResponse(plan);
  }

  @Get('/')
  @ApiOperation({ summary: 'List all financial plans' })
  @ApiResponse({ status: 200, type: [PlanResponseDto] })
  async listPlans(): Promise<PlanResponseDto[]> {
    const plans = await this.service.listPlans();
    return plans.map((p) => this.toPlanResponse(p));
  }

  @Get('/:planId')
  @ApiOperation({ summary: 'Get a financial plan' })
  @ApiResponse({ status: 200, type: PlanResponseDto })
  async getPlan(@Param('planId') planId: string): Promise<PlanResponseDto> {
    const plan = await this.service.getPlan(planId);
    return this.toPlanResponse(plan);
  }

  @Patch('/:planId')
  @ApiOperation({ summary: 'Update a financial plan' })
  @ApiResponse({ status: 200, type: PlanResponseDto })
  async updatePlan(
    @Param('planId') planId: string,
    @Body() dto: UpdatePlanDto,
  ): Promise<PlanResponseDto> {
    const plan = await this.service.updatePlan(planId, dto);
    return this.toPlanResponse(plan);
  }

  @Delete('/:planId')
  @ApiOperation({ summary: 'Delete a financial plan' })
  @ApiResponse({ status: 200, type: IdResponseDto })
  async deletePlan(@Param('planId') planId: string): Promise<IdResponseDto> {
    await this.service.deletePlan(planId);
    return { id: planId };
  }

  // =========================================================================
  // CATEGORIES
  // =========================================================================

  @Post('/:planId/categories')
  @ApiOperation({ summary: 'Create a category' })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  async createCategory(
    @Param('planId') planId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.service.createCategory(planId, dto);
    return this.toCategoryResponse(category);
  }

  @Get('/:planId/categories')
  @ApiOperation({ summary: 'List categories' })
  @ApiResponse({ status: 200, type: [CategoryResponseDto] })
  async listCategories(
    @Param('planId') planId: string,
  ): Promise<CategoryResponseDto[]> {
    const categories = await this.service.listCategories(planId);
    return categories.map((c) => this.toCategoryResponse(c));
  }

  @Patch('/:planId/categories/:categoryId')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  async updateCategory(
    @Param('planId') planId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.service.updateCategory(planId, categoryId, dto);
    return this.toCategoryResponse(category);
  }

  @Post('/:planId/categories/:categoryId/archive')
  @ApiOperation({ summary: 'Archive a category' })
  @ApiResponse({ status: 200, type: IdResponseDto })
  async archiveCategory(
    @Param('planId') planId: string,
    @Param('categoryId') categoryId: string,
  ): Promise<IdResponseDto> {
    await this.service.archiveCategory(planId, categoryId);
    return { id: categoryId };
  }

  @Post('/:planId/categories/:categoryId/restore')
  @ApiOperation({ summary: 'Restore a category' })
  @ApiResponse({ status: 200, type: IdResponseDto })
  async restoreCategory(
    @Param('planId') planId: string,
    @Param('categoryId') categoryId: string,
  ): Promise<IdResponseDto> {
    await this.service.restoreCategory(planId, categoryId);
    return { id: categoryId };
  }

  // =========================================================================
  // ACCOUNTS
  // =========================================================================

  @Post('/:planId/accounts')
  @ApiOperation({ summary: 'Create an account' })
  @ApiResponse({ status: 201, type: AccountResponseDto })
  async createAccount(
    @Param('planId') planId: string,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    const account = await this.service.createAccount(planId, dto);
    return this.toAccountResponse(account);
  }

  @Get('/:planId/accounts')
  @ApiOperation({ summary: 'List accounts' })
  @ApiResponse({ status: 200, type: [AccountResponseDto] })
  async listAccounts(
    @Param('planId') planId: string,
  ): Promise<AccountResponseDto[]> {
    const accounts = await this.service.listAccounts(planId);
    return accounts.map((a) => this.toAccountResponse(a));
  }

  @Get('/:planId/accounts/:accountId')
  @ApiOperation({ summary: 'Get an account' })
  @ApiResponse({ status: 200, type: AccountResponseDto })
  async getAccount(
    @Param('planId') planId: string,
    @Param('accountId') accountId: string,
  ): Promise<AccountResponseDto> {
    const account = await this.service.getAccount(planId, accountId);
    return this.toAccountResponse(account);
  }

  @Patch('/:planId/accounts/:accountId')
  @ApiOperation({ summary: 'Update an account' })
  @ApiResponse({ status: 200, type: AccountResponseDto })
  async updateAccount(
    @Param('planId') planId: string,
    @Param('accountId') accountId: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    const account = await this.service.updateAccount(planId, accountId, dto);
    return this.toAccountResponse(account);
  }

  @Post('/:planId/accounts/:accountId/archive')
  @ApiOperation({ summary: 'Archive an account' })
  @ApiResponse({ status: 200, type: IdResponseDto })
  async archiveAccount(
    @Param('planId') planId: string,
    @Param('accountId') accountId: string,
  ): Promise<IdResponseDto> {
    await this.service.archiveAccount(planId, accountId);
    return { id: accountId };
  }

  @Post('/:planId/accounts/:accountId/restore')
  @ApiOperation({ summary: 'Restore an account' })
  @ApiResponse({ status: 200, type: IdResponseDto })
  async restoreAccount(
    @Param('planId') planId: string,
    @Param('accountId') accountId: string,
  ): Promise<IdResponseDto> {
    await this.service.restoreAccount(planId, accountId);
    return { id: accountId };
  }

  @Post('/:planId/accounts/:accountId/balance-snapshots')
  @ApiOperation({ summary: 'Create a balance snapshot' })
  @ApiResponse({ status: 201, type: BalanceSnapshotResponseDto })
  async createBalanceSnapshot(
    @Param('planId') planId: string,
    @Param('accountId') accountId: string,
    @Body() body: { balanceCents: number; source?: SnapshotSource },
  ): Promise<BalanceSnapshotResponseDto> {
    const snapshot = await this.service.createBalanceSnapshot(
      planId,
      accountId,
      body.balanceCents,
      body.source,
    );
    return this.toBalanceSnapshotResponse(snapshot);
  }

  @Get('/:planId/accounts/:accountId/balance-snapshots')
  @ApiOperation({ summary: 'List balance snapshots' })
  @ApiResponse({ status: 200, type: [BalanceSnapshotResponseDto] })
  async listBalanceSnapshots(
    @Param('planId') planId: string,
    @Param('accountId') accountId: string,
  ): Promise<BalanceSnapshotResponseDto[]> {
    const snapshots = await this.service.listBalanceSnapshots(
      planId,
      accountId,
    );
    return snapshots.map((s) => this.toBalanceSnapshotResponse(s));
  }

  @Get('/:planId/accounts/:accountId/current-balance')
  @ApiOperation({ summary: 'Get current balance' })
  @ApiResponse({ status: 200, type: CurrentBalanceResponseDto })
  async getCurrentBalance(
    @Param('planId') planId: string,
    @Param('accountId') accountId: string,
  ): Promise<CurrentBalanceResponseDto> {
    const balance = await this.service.getCurrentBalance(planId, accountId);
    const account = await this.service.getAccount(planId, accountId);
    return {
      accountId: balance.accountId,
      accountName: account.name,
      balanceCents: balance.balanceCents,
      lastSnapshotAt: balance.lastSnapshotAt,
    };
  }

  // =========================================================================
  // INCOME SOURCES
  // =========================================================================

  @Post('/:planId/income-sources')
  @ApiOperation({ summary: 'Create an income source' })
  @ApiResponse({ status: 201, type: IncomeSourceResponseDto })
  async createIncomeSource(
    @Param('planId') planId: string,
    @Body() dto: CreateIncomeSourceDto,
  ): Promise<IncomeSourceResponseDto> {
    const source = await this.service.createIncomeSource(planId, dto);
    return this.toIncomeSourceResponse(source);
  }

  @Get('/:planId/income-sources')
  @ApiOperation({ summary: 'List income sources' })
  @ApiResponse({ status: 200, type: [IncomeSourceResponseDto] })
  async listIncomeSources(
    @Param('planId') planId: string,
  ): Promise<IncomeSourceResponseDto[]> {
    const sources = await this.service.listIncomeSources(planId);
    return sources.map((s) => this.toIncomeSourceResponse(s));
  }

  // =========================================================================
  // INCOME SCHEDULES
  // =========================================================================

  @Post('/:planId/income-sources/:incomeSourceId/schedules')
  @ApiOperation({ summary: 'Create an income schedule' })
  @ApiResponse({ status: 201, type: IncomeScheduleResponseDto })
  async createIncomeSchedule(
    @Param('planId') planId: string,
    @Param('incomeSourceId') incomeSourceId: string,
    @Body() dto: CreateIncomeScheduleDto,
  ): Promise<IncomeScheduleResponseDto> {
    const schedule = await this.service.createIncomeSchedule(
      planId,
      incomeSourceId,
      dto,
    );
    return this.toIncomeScheduleResponse(schedule);
  }

  @Get('/:planId/income-sources/:incomeSourceId/schedules')
  @ApiOperation({ summary: 'List income schedules' })
  @ApiResponse({ status: 200, type: [IncomeScheduleResponseDto] })
  async listIncomeSchedules(
    @Param('planId') planId: string,
    @Param('incomeSourceId') incomeSourceId: string,
  ): Promise<IncomeScheduleResponseDto[]> {
    const schedules = await this.service.listIncomeSchedules(
      planId,
      incomeSourceId,
    );
    return schedules.map((s) => this.toIncomeScheduleResponse(s));
  }

  // =========================================================================
  // INCOME SCHEDULE AMOUNT RULES
  // =========================================================================

  @Post(
    '/:planId/income-sources/:incomeSourceId/schedules/:scheduleId/amount-rules',
  )
  @ApiOperation({ summary: 'Create an income schedule amount rule' })
  @ApiResponse({ status: 201, type: IncomeScheduleAmountRuleResponseDto })
  async createIncomeScheduleAmountRule(
    @Param('planId') planId: string,
    @Param('incomeSourceId') incomeSourceId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: CreateIncomeScheduleAmountRuleDto,
  ): Promise<IncomeScheduleAmountRuleResponseDto> {
    const rule = await this.service.createIncomeScheduleAmountRule(
      planId,
      incomeSourceId,
      scheduleId,
      dto,
    );
    return this.toIncomeScheduleAmountRuleResponse(rule);
  }

  // =========================================================================
  // INCOME PAYMENTS
  // =========================================================================

  @Post('/:planId/income-payments')
  @ApiOperation({ summary: 'Create an income payment' })
  @ApiResponse({ status: 201, type: IncomePaymentResponseDto })
  async createIncomePayment(
    @Param('planId') planId: string,
    @Body() dto: CreateIncomePaymentDto,
  ): Promise<IncomePaymentResponseDto> {
    const payment = await this.service.createIncomePayment(planId, dto);
    return this.toIncomePaymentResponse(payment);
  }

  @Get('/:planId/income-payments')
  @ApiOperation({ summary: 'List income payments' })
  @ApiResponse({ status: 200, type: [IncomePaymentResponseDto] })
  async listIncomePayments(
    @Param('planId') planId: string,
  ): Promise<IncomePaymentResponseDto[]> {
    const payments = await this.service.listIncomePayments(planId);
    return payments.map((p) => this.toIncomePaymentResponse(p));
  }

  // =========================================================================
  // TRANSACTIONS
  // =========================================================================

  @Post('/:planId/transactions')
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  async createTransaction(
    @Param('planId') planId: string,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.service.createTransaction(planId, dto);
    return this.toTransactionResponse(transaction);
  }

  @Get('/:planId/transactions')
  @ApiOperation({ summary: 'List transactions' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async listTransactions(
    @Param('planId') planId: string,
  ): Promise<TransactionResponseDto[]> {
    const transactions = await this.service.listTransactions(planId);
    return transactions.map((t) => this.toTransactionResponse(t));
  }

  // =========================================================================
  // BUDGET PERIODS
  // =========================================================================

  @Post('/:planId/budget-periods')
  @ApiOperation({ summary: 'Create a budget period' })
  @ApiResponse({ status: 201, type: BudgetPeriodResponseDto })
  async createBudgetPeriod(
    @Param('planId') planId: string,
    @Body() dto: CreateBudgetPeriodDto,
  ): Promise<BudgetPeriodResponseDto> {
    const period = await this.service.createBudgetPeriod(planId, dto);
    return this.toBudgetPeriodResponse(period);
  }

  @Get('/:planId/budget-periods')
  @ApiOperation({ summary: 'List budget periods' })
  @ApiResponse({ status: 200, type: [BudgetPeriodResponseDto] })
  async listBudgetPeriods(
    @Param('planId') planId: string,
  ): Promise<BudgetPeriodResponseDto[]> {
    const periods = await this.service.listBudgetPeriods(planId);
    return periods.map((p) => this.toBudgetPeriodResponse(p));
  }

  @Get('/:planId/budget-periods/:periodId')
  @ApiOperation({ summary: 'Get a budget period' })
  @ApiResponse({ status: 200, type: BudgetPeriodResponseDto })
  async getBudgetPeriod(
    @Param('planId') planId: string,
    @Param('periodId') periodId: string,
  ): Promise<BudgetPeriodResponseDto> {
    const period = await this.service.getBudgetPeriod(planId, periodId);
    return this.toBudgetPeriodResponse(period);
  }

  // =========================================================================
  // BUDGET ITEMS
  // =========================================================================

  @Post('/:planId/budget-periods/:periodId/items')
  @ApiOperation({ summary: 'Create a budget item' })
  @ApiResponse({ status: 201, type: BudgetItemResponseDto })
  async createBudgetItem(
    @Param('planId') planId: string,
    @Param('periodId') periodId: string,
    @Body() dto: CreateBudgetItemDto,
  ): Promise<BudgetItemResponseDto> {
    const item = await this.service.createBudgetItem(planId, periodId, dto);
    return this.toBudgetItemResponse(item);
  }

  @Get('/:planId/budget-periods/:periodId/items')
  @ApiOperation({ summary: 'List budget items' })
  @ApiResponse({ status: 200, type: [BudgetItemResponseDto] })
  async listBudgetItems(
    @Param('planId') planId: string,
    @Param('periodId') periodId: string,
  ): Promise<BudgetItemResponseDto[]> {
    const items = await this.service.listBudgetItems(planId, periodId);
    return items.map((i) => this.toBudgetItemResponse(i));
  }

  // =========================================================================
  // RECURRING ITEMS
  // =========================================================================

  @Post('/:planId/recurring-items')
  @ApiOperation({ summary: 'Create a recurring item' })
  @ApiResponse({ status: 201, type: RecurringItemResponseDto })
  async createRecurringItem(
    @Param('planId') planId: string,
    @Body() dto: CreateRecurringItemDto,
  ): Promise<RecurringItemResponseDto> {
    const item = await this.service.createRecurringItem(planId, dto);
    return this.toRecurringItemResponse(item);
  }

  @Get('/:planId/recurring-items')
  @ApiOperation({ summary: 'List recurring items' })
  @ApiResponse({ status: 200, type: [RecurringItemResponseDto] })
  async listRecurringItems(
    @Param('planId') planId: string,
  ): Promise<RecurringItemResponseDto[]> {
    const items = await this.service.listRecurringItems(planId);
    return items.map((i) => this.toRecurringItemResponse(i));
  }

  // =========================================================================
  // DEBT PROJECTIONS
  // =========================================================================

  @Post('/:planId/debt-projections/runs')
  @ApiOperation({ summary: 'Create a debt projection run' })
  @ApiResponse({ status: 201, type: DebtProjectionRunResponseDto })
  async createDebtProjectionRun(
    @Param('planId') planId: string,
    @Body() dto: CreateDebtProjectionRunDto,
  ): Promise<DebtProjectionRunResponseDto> {
    const run = await this.service.createDebtProjectionRun(planId, dto);
    return this.toDebtProjectionRunResponse(run);
  }

  @Get('/:planId/debt-projections/runs')
  @ApiOperation({ summary: 'List debt projection runs' })
  @ApiResponse({ status: 200, type: [DebtProjectionRunResponseDto] })
  async listDebtProjectionRuns(
    @Param('planId') planId: string,
  ): Promise<DebtProjectionRunResponseDto[]> {
    const runs = await this.service.listDebtProjectionRuns(planId);
    return runs.map((r) => this.toDebtProjectionRunResponse(r));
  }

  // =========================================================================
  // PLAN SETTINGS
  // =========================================================================

  @Put('/:planId/settings/:key')
  @ApiOperation({ summary: 'Upsert a plan setting' })
  @ApiResponse({ status: 200, type: PlanSettingResponseDto })
  async upsertPlanSetting(
    @Param('planId') planId: string,
    @Param('key') key: string,
    @Body() dto: UpsertPlanSettingDto,
  ): Promise<PlanSettingResponseDto> {
    const setting = await this.service.upsertPlanSetting(planId, key, dto);
    return this.toPlanSettingResponse(setting);
  }

  @Get('/:planId/settings')
  @ApiOperation({ summary: 'List plan settings' })
  @ApiResponse({ status: 200, type: [PlanSettingResponseDto] })
  async listPlanSettings(
    @Param('planId') planId: string,
  ): Promise<PlanSettingResponseDto[]> {
    const settings = await this.service.listPlanSettings(planId);
    return settings.map((s) => this.toPlanSettingResponse(s));
  }

  // =========================================================================
  // SUMMARY NOTES
  // =========================================================================

  @Post('/:planId/summary-notes')
  @ApiOperation({ summary: 'Create a summary note' })
  @ApiResponse({ status: 201, type: SummaryNoteResponseDto })
  async createSummaryNote(
    @Param('planId') planId: string,
    @Body() dto: CreateSummaryNoteDto,
  ): Promise<SummaryNoteResponseDto> {
    const note = await this.service.createSummaryNote(planId, dto);
    return this.toSummaryNoteResponse(note);
  }

  @Get('/:planId/summary-notes')
  @ApiOperation({ summary: 'List summary notes' })
  @ApiResponse({ status: 200, type: [SummaryNoteResponseDto] })
  async listSummaryNotes(
    @Param('planId') planId: string,
  ): Promise<SummaryNoteResponseDto[]> {
    const notes = await this.service.listSummaryNotes(planId);
    return notes.map((n) => this.toSummaryNoteResponse(n));
  }

  // =========================================================================
  // DASHBOARD
  // =========================================================================

  @Get('/:planId/dashboard')
  @ApiOperation({ summary: 'Get dashboard' })
  @ApiResponse({ status: 200, type: DashboardResponseDto })
  async getDashboard(
    @Param('planId') planId: string,
  ): Promise<DashboardResponseDto> {
    return this.service.getDashboard(planId);
  }

  // =========================================================================
  // RESPONSE MAPPERS
  // =========================================================================

  private toPlanResponse(plan: any): PlanResponseDto {
    return {
      id: plan.id,
      metadataId: plan.metadataId,
      schemaVersion: plan.schemaVersion,
      name: plan.name,
      baseCurrency: plan.baseCurrency,
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: plan.status,
      objective: plan.objective,
      projectedDebtFreeDate: plan.projectedDebtFreeDate,
      projectedEmergencyFundCents: plan.projectedEmergencyFundCents,
      createdAt: plan.createdAt?.toISOString?.() ?? plan.createdAt,
      updatedAt: plan.updatedAt?.toISOString?.() ?? plan.updatedAt,
    };
  }

  private toCategoryResponse(category: any): CategoryResponseDto {
    return {
      id: category.id,
      code: category.code,
      name: category.name,
      idealPercentageBps: category.idealPercentageBps,
      description: category.description,
      archivedAt: category.archivedAt?.toISOString?.() ?? category.archivedAt,
      createdAt: category.createdAt?.toISOString?.() ?? category.createdAt,
      updatedAt: category.updatedAt?.toISOString?.() ?? category.updatedAt,
    };
  }

  private toAccountResponse(account: any): AccountResponseDto {
    return {
      id: account.id,
      name: account.name,
      accountType: account.accountType,
      currency: account.currency,
      status: account.status,
      externalSource: account.externalSource,
      externalId: account.externalId,
      archivedAt: account.archivedAt?.toISOString?.() ?? account.archivedAt,
      createdAt: account.createdAt?.toISOString?.() ?? account.createdAt,
      updatedAt: account.updatedAt?.toISOString?.() ?? account.updatedAt,
    };
  }

  private toBalanceSnapshotResponse(snapshot: any): BalanceSnapshotResponseDto {
    return {
      id: snapshot.id,
      observedAt: snapshot.observedAt?.toISOString?.() ?? snapshot.observedAt,
      balanceCents: snapshot.balanceCents,
      source: snapshot.source,
      createdAt: snapshot.createdAt?.toISOString?.() ?? snapshot.createdAt,
    };
  }

  private toIncomeSourceResponse(source: any): IncomeSourceResponseDto {
    return {
      id: source.id,
      name: source.name,
      currency: source.currency,
      defaultDepositAccountId: source.defaultDepositAccountId,
      active: source.active,
      createdAt: source.createdAt?.toISOString?.() ?? source.createdAt,
      updatedAt: source.updatedAt?.toISOString?.() ?? source.updatedAt,
    };
  }

  private toIncomeScheduleResponse(schedule: any): IncomeScheduleResponseDto {
    return {
      id: schedule.id,
      cadence: schedule.cadence,
      anchorPaymentDate: schedule.anchorPaymentDate,
      recurrenceRule: schedule.recurrenceRule,
      generatedThrough: schedule.generatedThrough,
      active: schedule.active,
      createdAt: schedule.createdAt?.toISOString?.() ?? schedule.createdAt,
      updatedAt: schedule.updatedAt?.toISOString?.() ?? schedule.updatedAt,
    };
  }

  private toIncomeScheduleAmountRuleResponse(
    rule: any,
  ): IncomeScheduleAmountRuleResponseDto {
    return {
      id: rule.id,
      paymentNumberInMonth: rule.paymentNumberInMonth,
      amountCents: rule.amountCents,
      validFrom: rule.validFrom,
      validUntil: rule.validUntil,
      createdAt: rule.createdAt?.toISOString?.() ?? rule.createdAt,
      updatedAt: rule.updatedAt?.toISOString?.() ?? rule.updatedAt,
    };
  }

  private toIncomePaymentResponse(payment: any): IncomePaymentResponseDto {
    return {
      id: payment.id,
      incomeSourceId: payment.incomeSourceId,
      incomeScheduleId: payment.incomeScheduleId,
      transactionId: payment.transactionId,
      paidOn: payment.paidOn,
      paymentNumberInMonth: payment.paymentNumberInMonth,
      status: payment.status,
      externalSource: payment.externalSource,
      externalId: payment.externalId,
      createdAt: payment.createdAt?.toISOString?.() ?? payment.createdAt,
      updatedAt: payment.updatedAt?.toISOString?.() ?? payment.updatedAt,
    };
  }

  private toTransactionResponse(transaction: any): TransactionResponseDto {
    return {
      id: transaction.id,
      occurredAt:
        transaction.occurredAt?.toISOString?.() ?? transaction.occurredAt,
      transactionType: transaction.transactionType,
      description: transaction.description,
      status: transaction.status,
      categoryId: transaction.categoryId,
      notes: transaction.notes,
      createdAt:
        transaction.createdAt?.toISOString?.() ?? transaction.createdAt,
      updatedAt:
        transaction.updatedAt?.toISOString?.() ?? transaction.updatedAt,
    };
  }

  private toBudgetPeriodResponse(period: any): BudgetPeriodResponseDto {
    return {
      id: period.id,
      periodType: period.periodType,
      startsOn: period.startsOn,
      endsOn: period.endsOn,
      fundingAmountCents: period.fundingAmountCents,
      plannedTotalCents: (period as any).plannedTotalCents ?? 0,
      unallocatedCents:
        (period as any).unallocatedCents ?? period.fundingAmountCents,
      status: period.status,
      incomePaymentId: period.incomePaymentId,
      createdAt: period.createdAt?.toISOString?.() ?? period.createdAt,
      updatedAt: period.updatedAt?.toISOString?.() ?? period.updatedAt,
    };
  }

  private toBudgetItemResponse(item: any): BudgetItemResponseDto {
    return {
      id: item.id,
      budgetPeriodId: item.budgetPeriodId,
      recurringItemId: item.recurringItemId,
      categoryId: item.categoryId,
      sourceAccountId: item.sourceAccountId,
      destinationAccountId: item.destinationAccountId,
      dueOn: item.dueOn,
      concept: item.concept,
      plannedAmountCents: item.plannedAmountCents,
      status: item.status,
      rolloverPolicy: item.rolloverPolicy,
      notes: item.notes,
      createdAt: item.createdAt?.toISOString?.() ?? item.createdAt,
      updatedAt: item.updatedAt?.toISOString?.() ?? item.updatedAt,
    };
  }

  private toRecurringItemResponse(item: any): RecurringItemResponseDto {
    return {
      id: item.id,
      itemType: item.itemType,
      concept: item.concept,
      amountCents: item.amountCents,
      recurrenceRule: item.recurrenceRule,
      startsOn: item.startsOn,
      endsOn: item.endsOn,
      lastGeneratedOn: item.lastGeneratedOn,
      categoryId: item.categoryId,
      sourceAccountId: item.sourceAccountId,
      destinationAccountId: item.destinationAccountId,
      active: item.active,
      createdAt: item.createdAt?.toISOString?.() ?? item.createdAt,
      updatedAt: item.updatedAt?.toISOString?.() ?? item.updatedAt,
    };
  }

  private toDebtProjectionRunResponse(run: any): DebtProjectionRunResponseDto {
    return {
      id: run.id,
      projectedFrom: run.projectedFrom,
      generatedAt: run.generatedAt?.toISOString?.() ?? run.generatedAt,
      algorithmVersion: run.algorithmVersion,
      createdAt: run.createdAt?.toISOString?.() ?? run.createdAt,
    };
  }

  private toPlanSettingResponse(setting: any): PlanSettingResponseDto {
    return {
      id: setting.id,
      key: setting.key,
      valueJson: setting.valueJson,
      createdAt: setting.createdAt?.toISOString?.() ?? setting.createdAt,
      updatedAt: setting.updatedAt?.toISOString?.() ?? setting.updatedAt,
    };
  }

  private toSummaryNoteResponse(note: any): SummaryNoteResponseDto {
    return {
      id: note.id,
      note: note.note,
      createdAt: note.createdAt?.toISOString?.() ?? note.createdAt,
      updatedAt: note.updatedAt?.toISOString?.() ?? note.updatedAt,
    };
  }
}
