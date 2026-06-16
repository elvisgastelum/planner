import {
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';

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
  GenerateIncomePaymentsDto,
  ImportPlanJsonDto,
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
import { PlannerService } from './planner.service';

export class CreateFinancialPlanCommand {
  constructor(public readonly dto: CreateFinancialPlanDto) {}
}
export class UpdateFinancialPlanCommand {
  constructor(
    public readonly planId: string,
    public readonly dto: UpdateFinancialPlanDto,
  ) {}
}
export class DeleteFinancialPlanCommand {
  constructor(public readonly planId: string) {}
}
export class ImportFinancialPlanJsonCommand {
  constructor(public readonly dto: ImportPlanJsonDto) {}
}
export class CreateAccountCommand {
  constructor(
    public readonly planId: string,
    public readonly dto: CreateAccountDto,
  ) {}
}
export class UpdateAccountCommand {
  constructor(
    public readonly accountId: string,
    public readonly dto: UpdateAccountDto,
  ) {}
}
export class DeleteAccountCommand {
  constructor(public readonly accountId: string) {}
}
export class CreateAllocationCategoryCommand {
  constructor(
    public readonly planId: string,
    public readonly dto: CreateAllocationCategoryDto,
  ) {}
}
export class UpdateAllocationCategoryCommand {
  constructor(
    public readonly planId: string,
    public readonly categoryId: string,
    public readonly dto: UpdateAllocationCategoryDto,
  ) {}
}
export class DeleteAllocationCategoryCommand {
  constructor(
    public readonly planId: string,
    public readonly categoryId: string,
  ) {}
}
export class CreateIncomeScheduleCommand {
  constructor(
    public readonly planId: string,
    public readonly dto: CreateIncomeScheduleDto,
  ) {}
}
export class UpdateIncomeScheduleCommand {
  constructor(
    public readonly planId: string,
    public readonly dto: UpdateIncomeScheduleDto,
  ) {}
}
export class DeleteIncomeScheduleCommand {
  constructor(public readonly planId: string) {}
}
export class GenerateIncomePaymentsCommand {
  constructor(
    public readonly planId: string,
    public readonly dto: GenerateIncomePaymentsDto,
  ) {}
}
export class CreateIncomePaymentCommand {
  constructor(
    public readonly planId: string,
    public readonly dto: CreateIncomePaymentDto,
  ) {}
}
export class UpdateIncomePaymentCommand {
  constructor(
    public readonly incomePaymentId: string,
    public readonly dto: UpdateIncomePaymentDto,
  ) {}
}
export class DeleteIncomePaymentCommand {
  constructor(public readonly incomePaymentId: string) {}
}
export class UpdateIncomePaymentStatusCommand {
  constructor(
    public readonly incomePaymentId: string,
    public readonly dto: UpdateIncomePaymentStatusDto,
  ) {}
}
export class FindIncomePaymentsSummaryQuery {
  constructor(public readonly planId: string) {}
}
export class CreatePaymentPeriodCommand {
  constructor(
    public readonly planId: string,
    public readonly dto: CreatePaymentPeriodDto,
  ) {}
}
export class UpdatePaymentPeriodCommand {
  constructor(
    public readonly periodId: string,
    public readonly dto: UpdatePaymentPeriodDto,
  ) {}
}
export class DeletePaymentPeriodCommand {
  constructor(public readonly periodId: string) {}
}
export class CreatePaymentPeriodItemCommand {
  constructor(
    public readonly periodId: string,
    public readonly dto: CreatePaymentPeriodItemDto,
  ) {}
}
export class UpdatePaymentPeriodItemCommand {
  constructor(
    public readonly itemId: string,
    public readonly dto: UpdatePaymentPeriodItemDto,
  ) {}
}
export class CompletePaymentPeriodItemCommand {
  constructor(
    public readonly itemId: string,
    public readonly dto: CompletePaymentPeriodItemDto,
  ) {}
}
export class DeletePaymentPeriodItemCommand {
  constructor(public readonly itemId: string) {}
}
export class CreateRecurringExpenseCommand {
  constructor(
    public readonly planId: string,
    public readonly dto: CreateRecurringExpenseDto,
  ) {}
}
export class UpdateRecurringExpenseCommand {
  constructor(
    public readonly recurringExpenseId: string,
    public readonly dto: UpdateRecurringExpenseDto,
  ) {}
}
export class DeleteRecurringExpenseCommand {
  constructor(public readonly recurringExpenseId: string) {}
}
export class CreateCompletedItemCommand {
  constructor(
    public readonly planId: string,
    public readonly dto: CreateCompletedItemDto,
  ) {}
}

export class FindPlansQuery {}
export class FindPlanByIdQuery {
  constructor(public readonly planId: string) {}
}
export class FindPlanOverviewQuery {
  constructor(public readonly planId: string) {}
}
export class FindPlanEditFormQuery {
  constructor(public readonly planId: string) {}
}
export class FindAccountsQuery {
  constructor(public readonly planId: string) {}
}
export class FindAllocationCategoriesQuery {
  constructor(public readonly planId: string) {}
}
export class FindIncomeScheduleQuery {
  constructor(public readonly planId: string) {}
}
export class FindIncomePaymentsQuery {
  constructor(public readonly planId: string) {}
}
export class FindIncomePaymentByIdQuery {
  constructor(
    public readonly planId: string,
    public readonly incomePaymentId: string,
  ) {}
}
export class FindPaymentPeriodsQuery {
  constructor(public readonly planId: string) {}
}
export class FindPaymentPeriodByIdQuery {
  constructor(public readonly periodId: string) {}
}
export class FindPaymentPeriodItemsQuery {
  constructor(public readonly periodId: string) {}
}
export class FindPaymentPeriodItemByIdQuery {
  constructor(public readonly itemId: string) {}
}
export class FindRecurringExpensesQuery {
  constructor(public readonly planId: string) {}
}
export class FindRecurringExpenseByIdQuery {
  constructor(
    public readonly planId: string,
    public readonly recurringExpenseId: string,
  ) {}
}
export class FindIncomePaymentRefsQuery {
  constructor(public readonly planId: string) {}
}
export class FindRecurringExpenseListQuery {
  constructor(public readonly planId: string) {}
}
export class FindCompletedItemsQuery {
  constructor(public readonly planId: string) {}
}

@CommandHandler(CreateFinancialPlanCommand)
export class CreateFinancialPlanHandler implements ICommandHandler<CreateFinancialPlanCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: CreateFinancialPlanCommand) {
    return this.service.createPlan(command.dto);
  }
}
@CommandHandler(UpdateFinancialPlanCommand)
export class UpdateFinancialPlanHandler implements ICommandHandler<UpdateFinancialPlanCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: UpdateFinancialPlanCommand) {
    return this.service.updatePlan(command.planId, command.dto);
  }
}
@CommandHandler(DeleteFinancialPlanCommand)
export class DeleteFinancialPlanHandler implements ICommandHandler<DeleteFinancialPlanCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: DeleteFinancialPlanCommand) {
    return this.service.deletePlan(command.planId);
  }
}
@CommandHandler(ImportFinancialPlanJsonCommand)
export class ImportFinancialPlanJsonHandler implements ICommandHandler<ImportFinancialPlanJsonCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: ImportFinancialPlanJsonCommand) {
    return this.service.importPlanJson(command.dto);
  }
}
@CommandHandler(CreateAccountCommand)
export class CreateAccountHandler implements ICommandHandler<CreateAccountCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: CreateAccountCommand) {
    return this.service.createAccount(command.planId, command.dto);
  }
}
@CommandHandler(UpdateAccountCommand)
export class UpdateAccountHandler implements ICommandHandler<UpdateAccountCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: UpdateAccountCommand) {
    return this.service.updateAccount(command.accountId, command.dto);
  }
}
@CommandHandler(DeleteAccountCommand)
export class DeleteAccountHandler implements ICommandHandler<DeleteAccountCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: DeleteAccountCommand) {
    return this.service.deleteAccount(command.accountId);
  }
}
@CommandHandler(CreateAllocationCategoryCommand)
export class CreateAllocationCategoryHandler implements ICommandHandler<CreateAllocationCategoryCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: CreateAllocationCategoryCommand) {
    return this.service.createCategory(command.planId, command.dto);
  }
}
@CommandHandler(UpdateAllocationCategoryCommand)
export class UpdateAllocationCategoryHandler implements ICommandHandler<UpdateAllocationCategoryCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: UpdateAllocationCategoryCommand) {
    return this.service.updateCategory(
      command.planId,
      command.categoryId,
      command.dto,
    );
  }
}
@CommandHandler(DeleteAllocationCategoryCommand)
export class DeleteAllocationCategoryHandler implements ICommandHandler<DeleteAllocationCategoryCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: DeleteAllocationCategoryCommand) {
    return this.service.deleteCategory(command.planId, command.categoryId);
  }
}
@CommandHandler(CreateIncomeScheduleCommand)
export class CreateIncomeScheduleHandler implements ICommandHandler<CreateIncomeScheduleCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: CreateIncomeScheduleCommand) {
    return this.service.upsertIncomeSchedule(command.planId, command.dto);
  }
}
@CommandHandler(UpdateIncomeScheduleCommand)
export class UpdateIncomeScheduleHandler implements ICommandHandler<UpdateIncomeScheduleCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: UpdateIncomeScheduleCommand) {
    return this.service.upsertIncomeSchedule(command.planId, command.dto);
  }
}
@CommandHandler(DeleteIncomeScheduleCommand)
export class DeleteIncomeScheduleHandler implements ICommandHandler<DeleteIncomeScheduleCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: DeleteIncomeScheduleCommand) {
    return this.service.deleteIncomeSchedule(command.planId);
  }
}
@CommandHandler(GenerateIncomePaymentsCommand)
export class GenerateIncomePaymentsHandler implements ICommandHandler<GenerateIncomePaymentsCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: GenerateIncomePaymentsCommand) {
    return this.service.generateIncomePayments(
      command.planId,
      command.dto.through,
    );
  }
}
@CommandHandler(CreateIncomePaymentCommand)
export class CreateIncomePaymentHandler implements ICommandHandler<CreateIncomePaymentCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: CreateIncomePaymentCommand) {
    return this.service.createIncomePayment(command.planId, command.dto);
  }
}
@CommandHandler(UpdateIncomePaymentCommand)
export class UpdateIncomePaymentHandler implements ICommandHandler<UpdateIncomePaymentCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: UpdateIncomePaymentCommand) {
    return this.service.updateIncomePayment(
      command.incomePaymentId,
      command.dto,
    );
  }
}
@CommandHandler(DeleteIncomePaymentCommand)
export class DeleteIncomePaymentHandler implements ICommandHandler<DeleteIncomePaymentCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: DeleteIncomePaymentCommand) {
    return this.service.deleteIncomePayment(command.incomePaymentId);
  }
}
@CommandHandler(UpdateIncomePaymentStatusCommand)
export class UpdateIncomePaymentStatusHandler
  implements ICommandHandler<UpdateIncomePaymentStatusCommand>
{
  constructor(private readonly service: PlannerService) {}
  execute(command: UpdateIncomePaymentStatusCommand) {
    return this.service.updateIncomePaymentStatus(
      command.incomePaymentId,
      command.dto,
    );
  }
}
@QueryHandler(FindIncomePaymentsSummaryQuery)
export class FindIncomePaymentsSummaryHandler
  implements IQueryHandler<FindIncomePaymentsSummaryQuery>
{
  constructor(private readonly service: PlannerService) {}
  execute(query: FindIncomePaymentsSummaryQuery) {
    return this.service.findIncomePaymentsSummary(query.planId);
  }
}
@CommandHandler(CreatePaymentPeriodCommand)
export class CreatePaymentPeriodHandler implements ICommandHandler<CreatePaymentPeriodCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: CreatePaymentPeriodCommand) {
    return this.service.createPaymentPeriod(command.planId, command.dto);
  }
}
@CommandHandler(UpdatePaymentPeriodCommand)
export class UpdatePaymentPeriodHandler implements ICommandHandler<UpdatePaymentPeriodCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: UpdatePaymentPeriodCommand) {
    return this.service.updatePaymentPeriod(command.periodId, command.dto);
  }
}
@CommandHandler(DeletePaymentPeriodCommand)
export class DeletePaymentPeriodHandler implements ICommandHandler<DeletePaymentPeriodCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: DeletePaymentPeriodCommand) {
    return this.service.deletePaymentPeriod(command.periodId);
  }
}
@CommandHandler(CreatePaymentPeriodItemCommand)
export class CreatePaymentPeriodItemHandler implements ICommandHandler<CreatePaymentPeriodItemCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: CreatePaymentPeriodItemCommand) {
    return this.service.createPaymentPeriodItem(command.periodId, command.dto);
  }
}
@CommandHandler(UpdatePaymentPeriodItemCommand)
export class UpdatePaymentPeriodItemHandler implements ICommandHandler<UpdatePaymentPeriodItemCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: UpdatePaymentPeriodItemCommand) {
    return this.service.updatePaymentPeriodItem(command.itemId, command.dto);
  }
}
@CommandHandler(CompletePaymentPeriodItemCommand)
export class CompletePaymentPeriodItemHandler implements ICommandHandler<CompletePaymentPeriodItemCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: CompletePaymentPeriodItemCommand) {
    return this.service.completePaymentPeriodItem(command.itemId, command.dto);
  }
}
@CommandHandler(DeletePaymentPeriodItemCommand)
export class DeletePaymentPeriodItemHandler implements ICommandHandler<DeletePaymentPeriodItemCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: DeletePaymentPeriodItemCommand) {
    return this.service.deletePaymentPeriodItem(command.itemId);
  }
}
@CommandHandler(CreateRecurringExpenseCommand)
export class CreateRecurringExpenseHandler implements ICommandHandler<CreateRecurringExpenseCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: CreateRecurringExpenseCommand) {
    return this.service.createRecurringExpense(command.planId, command.dto);
  }
}
@CommandHandler(UpdateRecurringExpenseCommand)
export class UpdateRecurringExpenseHandler implements ICommandHandler<UpdateRecurringExpenseCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: UpdateRecurringExpenseCommand) {
    return this.service.updateRecurringExpense(
      command.recurringExpenseId,
      command.dto,
    );
  }
}
@CommandHandler(DeleteRecurringExpenseCommand)
export class DeleteRecurringExpenseHandler implements ICommandHandler<DeleteRecurringExpenseCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: DeleteRecurringExpenseCommand) {
    return this.service.deleteRecurringExpense(command.recurringExpenseId);
  }
}
@CommandHandler(CreateCompletedItemCommand)
export class CreateCompletedItemHandler implements ICommandHandler<CreateCompletedItemCommand> {
  constructor(private readonly service: PlannerService) {}
  execute(command: CreateCompletedItemCommand) {
    return this.service.createCompletedItem(command.planId, command.dto);
  }
}

@QueryHandler(FindPlansQuery)
export class FindPlansHandler implements IQueryHandler<FindPlansQuery> {
  constructor(private readonly service: PlannerService) {}
  execute() {
    return this.service.findPlans();
  }
}
@QueryHandler(FindPlanByIdQuery)
export class FindPlanByIdHandler implements IQueryHandler<FindPlanByIdQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindPlanByIdQuery) {
    return this.service.findPlanById(query.planId);
  }
}
@QueryHandler(FindPlanOverviewQuery)
export class FindPlanOverviewHandler implements IQueryHandler<FindPlanOverviewQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindPlanOverviewQuery) {
    return this.service.findPlanOverview(query.planId);
  }
}
@QueryHandler(FindPlanEditFormQuery)
export class FindPlanEditFormHandler implements IQueryHandler<FindPlanEditFormQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindPlanEditFormQuery) {
    return this.service.findPlanEditForm(query.planId);
  }
}
@QueryHandler(FindAccountsQuery)
export class FindAccountsHandler implements IQueryHandler<FindAccountsQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindAccountsQuery) {
    return this.service.findAccounts(query.planId);
  }
}
@QueryHandler(FindAllocationCategoriesQuery)
export class FindAllocationCategoriesHandler implements IQueryHandler<FindAllocationCategoriesQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindAllocationCategoriesQuery) {
    return this.service.findCategories(query.planId);
  }
}
@QueryHandler(FindIncomeScheduleQuery)
export class FindIncomeScheduleHandler implements IQueryHandler<FindIncomeScheduleQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindIncomeScheduleQuery) {
    return this.service.requireIncomeSchedule(query.planId);
  }
}
@QueryHandler(FindIncomePaymentsQuery)
export class FindIncomePaymentsHandler implements IQueryHandler<FindIncomePaymentsQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindIncomePaymentsQuery) {
    return this.service.findIncomePayments(query.planId);
  }
}
@QueryHandler(FindIncomePaymentByIdQuery)
export class FindIncomePaymentByIdHandler implements IQueryHandler<FindIncomePaymentByIdQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindIncomePaymentByIdQuery) {
    return this.service.findIncomePaymentById(
      query.planId,
      query.incomePaymentId,
    );
  }
}
@QueryHandler(FindPaymentPeriodsQuery)
export class FindPaymentPeriodsHandler implements IQueryHandler<FindPaymentPeriodsQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindPaymentPeriodsQuery) {
    return this.service.findPaymentPeriods(query.planId);
  }
}
@QueryHandler(FindPaymentPeriodByIdQuery)
export class FindPaymentPeriodByIdHandler implements IQueryHandler<FindPaymentPeriodByIdQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindPaymentPeriodByIdQuery) {
    return this.service.findPaymentPeriodById(query.periodId);
  }
}
@QueryHandler(FindPaymentPeriodItemsQuery)
export class FindPaymentPeriodItemsHandler implements IQueryHandler<FindPaymentPeriodItemsQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindPaymentPeriodItemsQuery) {
    return this.service.findPaymentPeriodItems(query.periodId);
  }
}
@QueryHandler(FindPaymentPeriodItemByIdQuery)
export class FindPaymentPeriodItemByIdHandler implements IQueryHandler<FindPaymentPeriodItemByIdQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindPaymentPeriodItemByIdQuery) {
    return this.service.findPaymentPeriodItemById(query.itemId);
  }
}
@QueryHandler(FindRecurringExpensesQuery)
export class FindRecurringExpensesHandler implements IQueryHandler<FindRecurringExpensesQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindRecurringExpensesQuery) {
    return this.service.findRecurringExpenses(query.planId);
  }
}
@QueryHandler(FindRecurringExpenseByIdQuery)
export class FindRecurringExpenseByIdHandler implements IQueryHandler<FindRecurringExpenseByIdQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindRecurringExpenseByIdQuery) {
    return this.service.findRecurringExpenseById(
      query.planId,
      query.recurringExpenseId,
    );
  }
}

@QueryHandler(FindIncomePaymentRefsQuery)
export class FindIncomePaymentRefsHandler implements IQueryHandler<FindIncomePaymentRefsQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindIncomePaymentRefsQuery) {
    return this.service.findIncomePaymentRefs(query.planId);
  }
}

@QueryHandler(FindRecurringExpenseListQuery)
export class FindRecurringExpenseListHandler implements IQueryHandler<FindRecurringExpenseListQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindRecurringExpenseListQuery) {
    return this.service.findRecurringExpenseList(query.planId);
  }
}

@QueryHandler(FindCompletedItemsQuery)
export class FindCompletedItemsHandler implements IQueryHandler<FindCompletedItemsQuery> {
  constructor(private readonly service: PlannerService) {}
  execute(query: FindCompletedItemsQuery) {
    return this.service.findCompletedItems(query.planId);
  }
}

export const commandHandlers = [
  CreateFinancialPlanHandler,
  UpdateFinancialPlanHandler,
  DeleteFinancialPlanHandler,
  ImportFinancialPlanJsonHandler,
  CreateAccountHandler,
  UpdateAccountHandler,
  DeleteAccountHandler,
  CreateAllocationCategoryHandler,
  UpdateAllocationCategoryHandler,
  DeleteAllocationCategoryHandler,
  CreateIncomeScheduleHandler,
  UpdateIncomeScheduleHandler,
  DeleteIncomeScheduleHandler,
  GenerateIncomePaymentsHandler,
  CreateIncomePaymentHandler,
  UpdateIncomePaymentHandler,
  DeleteIncomePaymentHandler,
  UpdateIncomePaymentStatusHandler,
  CreatePaymentPeriodHandler,
  UpdatePaymentPeriodHandler,
  DeletePaymentPeriodHandler,
  CreatePaymentPeriodItemHandler,
  UpdatePaymentPeriodItemHandler,
  CompletePaymentPeriodItemHandler,
  DeletePaymentPeriodItemHandler,
  CreateRecurringExpenseHandler,
  UpdateRecurringExpenseHandler,
  DeleteRecurringExpenseHandler,
  CreateCompletedItemHandler,
];

export const queryHandlers = [
  FindPlansHandler,
  FindPlanByIdHandler,
  FindPlanOverviewHandler,
  FindPlanEditFormHandler,
  FindAccountsHandler,
  FindAllocationCategoriesHandler,
  FindIncomeScheduleHandler,
  FindIncomePaymentsHandler,
  FindIncomePaymentByIdHandler,
  FindPaymentPeriodsHandler,
  FindPaymentPeriodByIdHandler,
  FindPaymentPeriodItemsHandler,
  FindPaymentPeriodItemByIdHandler,
  FindRecurringExpensesHandler,
  FindRecurringExpenseByIdHandler,
  FindIncomePaymentRefsHandler,
  FindIncomePaymentsSummaryHandler,
  FindRecurringExpenseListHandler,
  FindCompletedItemsHandler,
];
