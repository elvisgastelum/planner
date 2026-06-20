import { ApiProperty } from '@nestjs/swagger';

import { AccountResponseDto } from './accounts.dto';
import { CurrentBalanceResponseDto } from './accounts.dto';
import { CategoryResponseDto } from './categories.dto';
import { IncomePaymentResponseDto } from './income.dto';
import { PlanResponseDto } from './plans.dto';
import { RecurringItemResponseDto } from './recurring-items.dto';
import { TransactionResponseDto } from './transactions.dto';

// =============================================================================
// DASHBOARD DTO
// =============================================================================

export class DashboardResponseDto {
  @ApiProperty()
  plan: PlanResponseDto;

  @ApiProperty({ type: [AccountResponseDto] })
  accounts: AccountResponseDto[];

  @ApiProperty({ type: [CategoryResponseDto] })
  categories: CategoryResponseDto[];

  @ApiProperty({ type: [CurrentBalanceResponseDto] })
  currentBalances: CurrentBalanceResponseDto[];

  @ApiProperty({ type: [IncomePaymentResponseDto] })
  recentIncomePayments: IncomePaymentResponseDto[];

  @ApiProperty({ type: [TransactionResponseDto] })
  recentTransactions: TransactionResponseDto[];

  @ApiProperty({ type: [RecurringItemResponseDto] })
  recurringItems: RecurringItemResponseDto[];
}
