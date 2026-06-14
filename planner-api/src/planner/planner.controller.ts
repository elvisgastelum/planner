import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ApiDefaultErrorResponses } from '../http';
import {
  AccountResponseDto,
  AllocationCategoryResponseDto,
  CompletedItemResponseDto,
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
  DeleteResultDto,
  FinancialPlanResponseDto,
  GenerateIncomePaymentsDto,
  ImportPlanJsonDto,
  ImportPlanJsonResponseDto,
  IncomePaymentRefResponseDto,
  IncomePaymentResponseDto,
  IncomeScheduleResponseDto,
  PaymentPeriodItemResponseDto,
  PaymentPeriodResponseDto,
  PaymentPeriodSummaryResponseDto,
  PlanEditFormResponseDto,
  PlanOverviewResponseDto,
  RecurringExpenseListResponseDto,
  RecurringExpenseResponseDto,
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
  CompletePaymentPeriodItemCommand,
  CreateAccountCommand,
  CreateAllocationCategoryCommand,
  CreateCompletedItemCommand,
  CreateFinancialPlanCommand,
  CreateIncomePaymentCommand,
  CreateIncomeScheduleCommand,
  CreatePaymentPeriodCommand,
  CreatePaymentPeriodItemCommand,
  CreateRecurringExpenseCommand,
  DeleteAccountCommand,
  DeleteAllocationCategoryCommand,
  DeleteFinancialPlanCommand,
  DeleteIncomePaymentCommand,
  DeleteIncomeScheduleCommand,
  DeletePaymentPeriodCommand,
  DeletePaymentPeriodItemCommand,
  DeleteRecurringExpenseCommand,
  FindAccountsQuery,
  FindAllocationCategoriesQuery,
  FindCompletedItemsQuery,
  FindIncomePaymentByIdQuery,
  FindIncomePaymentRefsQuery,
  FindIncomePaymentsQuery,
  FindIncomeScheduleQuery,
  FindPaymentPeriodByIdQuery,
  FindPaymentPeriodItemByIdQuery,
  FindPaymentPeriodItemsQuery,
  FindPaymentPeriodsQuery,
  FindPlanByIdQuery,
  FindPlanEditFormQuery,
  FindPlanOverviewQuery,
  FindPlansQuery,
  FindRecurringExpenseByIdQuery,
  FindRecurringExpenseListQuery,
  FindRecurringExpensesQuery,
  GenerateIncomePaymentsCommand,
  ImportFinancialPlanJsonCommand,
  UpdateAccountCommand,
  UpdateAllocationCategoryCommand,
  UpdateFinancialPlanCommand,
  UpdateIncomePaymentCommand,
  UpdateIncomeScheduleCommand,
  UpdatePaymentPeriodCommand,
  UpdatePaymentPeriodItemCommand,
  UpdateRecurringExpenseCommand,
} from './planner.cqrs';

@ApiTags('plans')
@ApiDefaultErrorResponses()
@Controller({ path: '', version: '1' })
export class PlannerController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Version('1')
  @ApiOkResponse({
    description: 'List financial plans',
    type: [FinancialPlanResponseDto],
  })
  findPlans() {
    return this.queryBus.execute(new FindPlansQuery());
  }

  @Post()
  @Version('1')
  @ApiCreatedResponse({
    description: 'Create a financial plan',
    type: FinancialPlanResponseDto,
  })
  createPlan(@Body() dto: CreateFinancialPlanDto) {
    return this.commandBus.execute(new CreateFinancialPlanCommand(dto));
  }

  @Post('import-json')
  @Version('1')
  @ApiCreatedResponse({
    description: 'Import the source financial JSON into normalized tables',
    type: ImportPlanJsonResponseDto,
  })
  importJson(@Body() dto: ImportPlanJsonDto = {}) {
    return this.commandBus.execute(new ImportFinancialPlanJsonCommand(dto));
  }

  @Get(':planId')
  @Version('1')
  @ApiOkResponse({
    description: 'Get financial plan metadata and summary fields',
    type: FinancialPlanResponseDto,
  })
  findPlan(@Param('planId') planId: string) {
    return this.queryBus.execute(new FindPlanByIdQuery(planId));
  }

  @Get(':planId/overview')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerFindPlanOverviewV1' })
  @ApiOkResponse({
    description: 'Get financial plan overview',
    type: PlanOverviewResponseDto,
  })
  findPlanOverview(@Param('planId') planId: string) {
    return this.queryBus.execute(new FindPlanOverviewQuery(planId));
  }

  @Get(':planId/edit-form')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerFindPlanEditFormV1' })
  @ApiOkResponse({
    description: 'Get plan edit form data',
    type: PlanEditFormResponseDto,
  })
  findPlanEditForm(@Param('planId') planId: string) {
    return this.queryBus.execute(new FindPlanEditFormQuery(planId));
  }

  @Patch(':planId')
  @Version('1')
  @ApiOkResponse({
    description: 'Update a financial plan',
    type: FinancialPlanResponseDto,
  })
  updatePlan(
    @Param('planId') planId: string,
    @Body() dto: UpdateFinancialPlanDto,
  ) {
    return this.commandBus.execute(new UpdateFinancialPlanCommand(planId, dto));
  }

  @Delete(':planId')
  @Version('1')
  @ApiOkResponse({
    description: 'Delete a financial plan',
    type: DeleteResultDto,
  })
  deletePlan(@Param('planId') planId: string) {
    return this.commandBus.execute(new DeleteFinancialPlanCommand(planId));
  }

  @Get(':planId/accounts')
  @Version('1')
  @ApiOkResponse({
    description: 'List accounts for a financial plan',
    type: [AccountResponseDto],
  })
  findAccounts(@Param('planId') planId: string) {
    return this.queryBus.execute(new FindAccountsQuery(planId));
  }

  @Post(':planId/accounts')
  @Version('1')
  @ApiCreatedResponse({
    description: 'Create an account for a financial plan',
    type: AccountResponseDto,
  })
  createAccount(
    @Param('planId') planId: string,
    @Body() dto: CreateAccountDto,
  ) {
    return this.commandBus.execute(new CreateAccountCommand(planId, dto));
  }

  @Patch('accounts/:accountId')
  @Version('1')
  @ApiOkResponse({
    description: 'Update an account',
    type: AccountResponseDto,
  })
  updateAccount(
    @Param('accountId') accountId: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.commandBus.execute(new UpdateAccountCommand(accountId, dto));
  }

  @Delete('accounts/:accountId')
  @Version('1')
  @ApiOkResponse({
    description: 'Delete an account',
    type: DeleteResultDto,
  })
  deleteAccount(@Param('accountId') accountId: string) {
    return this.commandBus.execute(new DeleteAccountCommand(accountId));
  }

  @Get(':planId/categories')
  @Version('1')
  @ApiOkResponse({
    description: 'List allocation categories for a financial plan',
    type: [AllocationCategoryResponseDto],
  })
  findCategories(@Param('planId') planId: string) {
    return this.queryBus.execute(new FindAllocationCategoriesQuery(planId));
  }

  @Post(':planId/categories')
  @Version('1')
  @ApiCreatedResponse({
    description: 'Create an allocation category for a financial plan',
    type: AllocationCategoryResponseDto,
  })
  createCategory(
    @Param('planId') planId: string,
    @Body() dto: CreateAllocationCategoryDto,
  ) {
    return this.commandBus.execute(
      new CreateAllocationCategoryCommand(planId, dto),
    );
  }

  @Patch(':planId/categories/:categoryId')
  @Version('1')
  @ApiOkResponse({
    description: 'Update an allocation category',
    type: AllocationCategoryResponseDto,
  })
  updateCategory(
    @Param('planId') planId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateAllocationCategoryDto,
  ) {
    return this.commandBus.execute(
      new UpdateAllocationCategoryCommand(planId, categoryId, dto),
    );
  }

  @Delete(':planId/categories/:categoryId')
  @Version('1')
  @ApiOkResponse({
    description: 'Delete an allocation category',
    type: DeleteResultDto,
  })
  deleteCategory(
    @Param('planId') planId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.commandBus.execute(
      new DeleteAllocationCategoryCommand(planId, categoryId),
    );
  }

  @Get(':planId/income-schedule')
  @Version('1')
  @ApiOkResponse({
    description: 'Get the income schedule for a financial plan',
    type: IncomeScheduleResponseDto,
  })
  findIncomeSchedule(@Param('planId') planId: string) {
    return this.queryBus.execute(new FindIncomeScheduleQuery(planId));
  }

  @Post(':planId/income-schedule')
  @Version('1')
  @ApiCreatedResponse({
    description: 'Create or replace the income schedule for a financial plan',
    type: IncomeScheduleResponseDto,
  })
  createIncomeSchedule(
    @Param('planId') planId: string,
    @Body() dto: CreateIncomeScheduleDto,
  ) {
    return this.commandBus.execute(
      new CreateIncomeScheduleCommand(planId, dto),
    );
  }

  @Patch(':planId/income-schedule')
  @Version('1')
  @ApiOkResponse({
    description: 'Update the income schedule for a financial plan',
    type: IncomeScheduleResponseDto,
  })
  updateIncomeSchedule(
    @Param('planId') planId: string,
    @Body() dto: UpdateIncomeScheduleDto,
  ) {
    return this.commandBus.execute(
      new UpdateIncomeScheduleCommand(planId, dto),
    );
  }

  @Delete(':planId/income-schedule')
  @Version('1')
  @ApiOkResponse({
    description: 'Delete the income schedule for a financial plan',
    type: DeleteResultDto,
  })
  deleteIncomeSchedule(@Param('planId') planId: string) {
    return this.commandBus.execute(new DeleteIncomeScheduleCommand(planId));
  }

  @Post(':planId/income-payments/generate')
  @Version('1')
  @ApiCreatedResponse({
    description: 'Generate projected income payments from the schedule rules',
    type: [IncomePaymentResponseDto],
  })
  generateIncomePayments(
    @Param('planId') planId: string,
    @Body() dto: GenerateIncomePaymentsDto,
  ) {
    return this.commandBus.execute(
      new GenerateIncomePaymentsCommand(planId, dto),
    );
  }

  @Get(':planId/income-payments')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerFindIncomePaymentsV1' })
  @ApiOkResponse({
    description: 'List income payments for a financial plan',
    type: [IncomePaymentResponseDto],
  })
  findIncomePayments(@Param('planId') planId: string) {
    return this.queryBus.execute(new FindIncomePaymentsQuery(planId));
  }

  @Get(':planId/income-payments/refs')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerFindIncomePaymentRefsV1' })
  @ApiOkResponse({
    description: 'List lightweight income payment refs',
    type: [IncomePaymentRefResponseDto],
  })
  findIncomePaymentRefs(@Param('planId') planId: string) {
    return this.queryBus.execute(new FindIncomePaymentRefsQuery(planId));
  }

  @Get(':planId/income-payments/:incomePaymentId')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerFindIncomePaymentByIdV1' })
  @ApiOkResponse({
    description: 'Get an income payment',
    type: IncomePaymentResponseDto,
  })
  findIncomePayment(
    @Param('planId') planId: string,
    @Param('incomePaymentId') incomePaymentId: string,
  ) {
    return this.queryBus.execute(
      new FindIncomePaymentByIdQuery(planId, incomePaymentId),
    );
  }

  @Post(':planId/income-payments')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerCreateIncomePaymentV1' })
  @ApiCreatedResponse({
    description: 'Create an income payment for a financial plan',
    type: IncomePaymentResponseDto,
  })
  createIncomePayment(
    @Param('planId') planId: string,
    @Body() dto: CreateIncomePaymentDto,
  ) {
    return this.commandBus.execute(new CreateIncomePaymentCommand(planId, dto));
  }

  @Patch('income-payments/:incomePaymentId')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerUpdateIncomePaymentV1' })
  @ApiOkResponse({
    description: 'Update an income payment',
    type: IncomePaymentResponseDto,
  })
  updateIncomePayment(
    @Param('incomePaymentId') incomePaymentId: string,
    @Body() dto: UpdateIncomePaymentDto,
  ) {
    return this.commandBus.execute(
      new UpdateIncomePaymentCommand(incomePaymentId, dto),
    );
  }

  @Delete('income-payments/:incomePaymentId')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerDeleteIncomePaymentV1' })
  @ApiOkResponse({
    description: 'Delete an income payment',
    type: DeleteResultDto,
  })
  deleteIncomePayment(@Param('incomePaymentId') incomePaymentId: string) {
    return this.commandBus.execute(
      new DeleteIncomePaymentCommand(incomePaymentId),
    );
  }

  @Get(':planId/payment-periods')
  @Version('1')
  @ApiOkResponse({
    description: 'List payment period summaries for a financial plan',
    type: [PaymentPeriodSummaryResponseDto],
  })
  findPaymentPeriods(@Param('planId') planId: string) {
    return this.queryBus.execute(new FindPaymentPeriodsQuery(planId));
  }

  @Post(':planId/payment-periods')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerCreatePaymentPeriodV1' })
  @ApiCreatedResponse({
    description: 'Create a payment period for a financial plan',
    type: PaymentPeriodResponseDto,
  })
  createPaymentPeriod(
    @Param('planId') planId: string,
    @Body() dto: CreatePaymentPeriodDto,
  ) {
    return this.commandBus.execute(new CreatePaymentPeriodCommand(planId, dto));
  }

  @Get('payment-periods/:periodId')
  @Version('1')
  @ApiOkResponse({
    description: 'Get a payment period with its income payment and items',
    type: PaymentPeriodResponseDto,
  })
  findPaymentPeriod(@Param('periodId') periodId: string) {
    return this.queryBus.execute(new FindPaymentPeriodByIdQuery(periodId));
  }

  @Patch('payment-periods/:periodId')
  @Version('1')
  @ApiOkResponse({
    description: 'Update a payment period',
    type: PaymentPeriodResponseDto,
  })
  updatePaymentPeriod(
    @Param('periodId') periodId: string,
    @Body() dto: UpdatePaymentPeriodDto,
  ) {
    return this.commandBus.execute(
      new UpdatePaymentPeriodCommand(periodId, dto),
    );
  }

  @Delete('payment-periods/:periodId')
  @Version('1')
  @ApiOkResponse({
    description: 'Delete a payment period',
    type: DeleteResultDto,
  })
  deletePaymentPeriod(@Param('periodId') periodId: string) {
    return this.commandBus.execute(new DeletePaymentPeriodCommand(periodId));
  }

  @Get('payment-periods/:periodId/items')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerFindPaymentPeriodItemsV1' })
  @ApiOkResponse({
    description: 'List items for a payment period',
    type: [PaymentPeriodItemResponseDto],
  })
  findPaymentPeriodItems(@Param('periodId') periodId: string) {
    return this.queryBus.execute(new FindPaymentPeriodItemsQuery(periodId));
  }

  @Get('payment-period-items/:itemId')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerFindPaymentPeriodItemByIdV1' })
  @ApiOkResponse({
    description: 'Get a payment period item',
    type: PaymentPeriodItemResponseDto,
  })
  findPaymentPeriodItem(@Param('itemId') itemId: string) {
    return this.queryBus.execute(new FindPaymentPeriodItemByIdQuery(itemId));
  }

  @Post('payment-periods/:periodId/items')
  @Version('1')
  @ApiCreatedResponse({
    description: 'Create an item for a payment period',
    type: PaymentPeriodItemResponseDto,
  })
  createPaymentPeriodItem(
    @Param('periodId') periodId: string,
    @Body() dto: CreatePaymentPeriodItemDto,
  ) {
    return this.commandBus.execute(
      new CreatePaymentPeriodItemCommand(periodId, dto),
    );
  }

  @Patch('payment-period-items/:itemId')
  @Version('1')
  @ApiOkResponse({
    description: 'Update a payment period item',
    type: PaymentPeriodItemResponseDto,
  })
  updatePaymentPeriodItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePaymentPeriodItemDto,
  ) {
    return this.commandBus.execute(
      new UpdatePaymentPeriodItemCommand(itemId, dto),
    );
  }

  @Post('payment-period-items/:itemId/complete')
  @Version('1')
  @ApiCreatedResponse({
    description: 'Mark a payment period item as completed',
    type: PaymentPeriodItemResponseDto,
  })
  completePaymentPeriodItem(
    @Param('itemId') itemId: string,
    @Body() dto: CompletePaymentPeriodItemDto,
  ) {
    return this.commandBus.execute(
      new CompletePaymentPeriodItemCommand(itemId, dto),
    );
  }

  @Delete('payment-period-items/:itemId')
  @Version('1')
  @ApiOkResponse({
    description: 'Delete a payment period item',
    type: DeleteResultDto,
  })
  deletePaymentPeriodItem(@Param('itemId') itemId: string) {
    return this.commandBus.execute(new DeletePaymentPeriodItemCommand(itemId));
  }

  @Get(':planId/recurring-expenses')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerFindRecurringExpensesV1' })
  @ApiOkResponse({
    description: 'List recurring expenses for a financial plan',
    type: [RecurringExpenseResponseDto],
  })
  findRecurringExpenses(@Param('planId') planId: string) {
    return this.queryBus.execute(new FindRecurringExpensesQuery(planId));
  }

  @Get(':planId/recurring-expenses/list')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerFindRecurringExpenseListV1' })
  @ApiOkResponse({
    description: 'List lightweight recurring expenses',
    type: [RecurringExpenseListResponseDto],
  })
  findRecurringExpenseList(@Param('planId') planId: string) {
    return this.queryBus.execute(new FindRecurringExpenseListQuery(planId));
  }

  @Get(':planId/completed-items')
  @Version('1')
  @ApiOkResponse({
    description: 'List completed items for a financial plan',
    type: [CompletedItemResponseDto],
  })
  findCompletedItems(@Param('planId') planId: string) {
    return this.queryBus.execute(new FindCompletedItemsQuery(planId));
  }

  @Post(':planId/recurring-expenses')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerCreateRecurringExpenseV1' })
  @ApiCreatedResponse({
    description: 'Create a recurring expense for a financial plan',
    type: RecurringExpenseResponseDto,
  })
  createRecurringExpense(
    @Param('planId') planId: string,
    @Body() dto: CreateRecurringExpenseDto,
  ) {
    return this.commandBus.execute(
      new CreateRecurringExpenseCommand(planId, dto),
    );
  }

  @Patch('recurring-expenses/:recurringExpenseId')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerUpdateRecurringExpenseV1' })
  @ApiOkResponse({
    description: 'Update a recurring expense',
    type: RecurringExpenseResponseDto,
  })
  updateRecurringExpense(
    @Param('recurringExpenseId') recurringExpenseId: string,
    @Body() dto: UpdateRecurringExpenseDto,
  ) {
    return this.commandBus.execute(
      new UpdateRecurringExpenseCommand(recurringExpenseId, dto),
    );
  }

  @Delete('recurring-expenses/:recurringExpenseId')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerDeleteRecurringExpenseV1' })
  @ApiOkResponse({
    description: 'Delete a recurring expense',
    type: DeleteResultDto,
  })
  deleteRecurringExpense(
    @Param('recurringExpenseId') recurringExpenseId: string,
  ) {
    return this.commandBus.execute(
      new DeleteRecurringExpenseCommand(recurringExpenseId),
    );
  }

  @Get(':planId/recurring-expenses/:recurringExpenseId')
  @Version('1')
  @ApiOperation({ operationId: 'plannerControllerFindRecurringExpenseByIdV1' })
  @ApiOkResponse({
    description: 'Get a recurring expense',
    type: RecurringExpenseResponseDto,
  })
  findRecurringExpense(
    @Param('planId') planId: string,
    @Param('recurringExpenseId') recurringExpenseId: string,
  ) {
    return this.queryBus.execute(
      new FindRecurringExpenseByIdQuery(planId, recurringExpenseId),
    );
  }

  @Post(':planId/completed-items')
  @Version('1')
  @ApiCreatedResponse({
    description: 'Create a completed item for a financial plan',
    type: CompletedItemResponseDto,
  })
  createCompletedItem(
    @Param('planId') planId: string,
    @Body() dto: CreateCompletedItemDto,
  ) {
    return this.commandBus.execute(new CreateCompletedItemCommand(planId, dto));
  }
}
