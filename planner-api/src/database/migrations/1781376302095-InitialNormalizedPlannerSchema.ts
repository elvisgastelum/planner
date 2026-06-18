import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
  TableUnique,
  TableCheck,
} from 'typeorm';

/**
 * Initial normalized schema for the Financial Planner application.
 *
 * This migration creates all tables for the normalized database schema,
 * including proper foreign key constraints, indexes, check constraints,
 * and partial unique indexes for external IDs.
 *
 * Tables are created in dependency order to satisfy foreign key references.
 *
 * NOTE: Check constraints are implemented via TableCheck where supported.
 * SQLite has limited ALTER TABLE support, so some constraints may be
 * enforced at the application level or via triggers if TableCheck fails.
 */
export class InitialNormalizedPlannerSchema1781376302095 implements MigrationInterface {
  name = 'InitialNormalizedPlannerSchema1781376302095';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // -----------------------------------------------------------------------
    // 1. Create tables in dependency order with check constraints
    // -----------------------------------------------------------------------

    // financial_plans - root entity
    await queryRunner.createTable(
      new Table({
        name: 'financial_plans',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'metadata_id', type: 'varchar', isUnique: true },
          { name: 'schema_version', type: 'varchar', default: "'1.0.0'" },
          { name: 'name', type: 'varchar', isNullable: false },
          {
            name: 'base_currency',
            type: 'varchar',
            length: '3',
            default: "'MXN'",
          },
          { name: 'start_date', type: 'date', isNullable: false },
          { name: 'end_date', type: 'date', isNullable: true },
          { name: 'status', type: 'varchar', default: "'active'" },
          { name: 'objective', type: 'text', isNullable: true },
          { name: 'projected_debt_free_date', type: 'date', isNullable: true },
          {
            name: 'projected_emergency_fund_cents',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
        checks: [
          new TableCheck({ expression: `length(base_currency) = 3` }),
          new TableCheck({
            expression: `end_date IS NULL OR end_date >= start_date`,
          }),
          new TableCheck({
            expression: `projected_emergency_fund_cents IS NULL OR projected_emergency_fund_cents >= 0`,
          }),
        ],
      }),
    );

    await queryRunner.createIndex(
      'financial_plans',
      new TableIndex({
        name: 'IDX_financial_plans_metadata_id',
        columnNames: ['metadata_id'],
        isUnique: true,
      }),
    );

    // allocation_categories
    await queryRunner.createTable(
      new Table({
        name: 'allocation_categories',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'plan_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'code', type: 'varchar', isNullable: false },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'ideal_percentage_bps', type: 'integer', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'archived_at', type: 'datetime', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
        checks: [
          new TableCheck({
            expression: `ideal_percentage_bps >= 0 AND ideal_percentage_bps <= 10000`,
          }),
        ],
      }),
    );

    await queryRunner.createIndex(
      'allocation_categories',
      new TableIndex({
        name: 'IDX_allocation_categories_plan_id',
        columnNames: ['plan_id'],
      }),
    );
    await queryRunner.createUniqueConstraint(
      'allocation_categories',
      new TableUnique({
        name: 'UQ_allocation_categories_plan_id_code',
        columnNames: ['plan_id', 'code'],
      }),
    );

    // financial_accounts
    await queryRunner.createTable(
      new Table({
        name: 'financial_accounts',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'plan_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'external_source', type: 'varchar', isNullable: true },
          { name: 'external_id', type: 'varchar', isNullable: true },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'account_type', type: 'varchar', isNullable: false },
          { name: 'currency', type: 'varchar', length: '3', isNullable: false },
          { name: 'status', type: 'varchar', default: "'active'" },
          { name: 'archived_at', type: 'datetime', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
        checks: [new TableCheck({ expression: `length(currency) = 3` })],
      }),
    );

    await queryRunner.createIndex(
      'financial_accounts',
      new TableIndex({
        name: 'IDX_financial_accounts_plan_id',
        columnNames: ['plan_id'],
      }),
    );

    // liability_terms (PK is account_id)
    await queryRunner.createTable(
      new Table({
        name: 'liability_terms',
        columns: [
          {
            name: 'account_id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'original_principal_cents',
            type: 'integer',
            isNullable: true,
          },
          { name: 'credit_limit_cents', type: 'integer', isNullable: true },
          { name: 'apr_bps', type: 'integer', isNullable: true },
          { name: 'minimum_payment_cents', type: 'integer', isNullable: true },
          { name: 'due_day', type: 'integer', isNullable: true },
          { name: 'opened_on', type: 'date', isNullable: true },
          { name: 'maturity_date', type: 'date', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
        checks: [
          new TableCheck({
            expression: `due_day IS NULL OR (due_day >= 1 AND due_day <= 31)`,
          }),
          new TableCheck({
            expression: `maturity_date IS NULL OR opened_on IS NULL OR maturity_date >= opened_on`,
          }),
          new TableCheck({
            expression: `original_principal_cents IS NULL OR original_principal_cents >= 0`,
          }),
          new TableCheck({
            expression: `credit_limit_cents IS NULL OR credit_limit_cents >= 0`,
          }),
          new TableCheck({ expression: `apr_bps IS NULL OR apr_bps >= 0` }),
          new TableCheck({
            expression: `minimum_payment_cents IS NULL OR minimum_payment_cents >= 0`,
          }),
        ],
      }),
    );

    // account_balance_snapshots
    await queryRunner.createTable(
      new Table({
        name: 'account_balance_snapshots',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          {
            name: 'account_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          { name: 'observed_at', type: 'datetime', isNullable: false },
          { name: 'balance_cents', type: 'integer', isNullable: false },
          { name: 'source', type: 'varchar', isNullable: false },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'account_balance_snapshots',
      new TableIndex({
        name: 'IDX_account_balance_snapshots_account_id_observed_at',
        columnNames: ['account_id', 'observed_at'],
      }),
    );

    // income_sources
    await queryRunner.createTable(
      new Table({
        name: 'income_sources',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'plan_id', type: 'varchar', length: '36', isNullable: false },
          {
            name: 'default_deposit_account_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'currency', type: 'varchar', length: '3', isNullable: false },
          { name: 'active', type: 'boolean', default: '1' },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
        checks: [new TableCheck({ expression: `length(currency) = 3` })],
      }),
    );

    await queryRunner.createIndex(
      'income_sources',
      new TableIndex({
        name: 'IDX_income_sources_plan_id',
        columnNames: ['plan_id'],
      }),
    );

    // income_schedules
    await queryRunner.createTable(
      new Table({
        name: 'income_schedules',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          {
            name: 'income_source_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          { name: 'cadence', type: 'varchar', isNullable: false },
          { name: 'anchor_payment_date', type: 'date', isNullable: false },
          { name: 'recurrence_rule', type: 'text', isNullable: true },
          { name: 'generated_through', type: 'date', isNullable: true },
          { name: 'active', type: 'boolean', default: '1' },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
      }),
    );

    // income_schedule_amount_rules
    await queryRunner.createTable(
      new Table({
        name: 'income_schedule_amount_rules',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          {
            name: 'income_schedule_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'payment_number_in_month',
            type: 'integer',
            isNullable: true,
          },
          { name: 'amount_cents', type: 'integer', isNullable: false },
          { name: 'valid_from', type: 'date', isNullable: true },
          { name: 'valid_until', type: 'date', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
        checks: [
          new TableCheck({ expression: `amount_cents > 0` }),
          new TableCheck({
            expression: `valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from`,
          }),
        ],
      }),
    );

    // transactions
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'plan_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'external_source', type: 'varchar', isNullable: true },
          { name: 'external_id', type: 'varchar', isNullable: true },
          {
            name: 'category_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          { name: 'occurred_at', type: 'datetime', isNullable: false },
          { name: 'description', type: 'varchar', isNullable: false },
          { name: 'transaction_type', type: 'varchar', isNullable: false },
          { name: 'status', type: 'varchar', isNullable: false },
          { name: 'notes', type: 'text', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_transactions_plan_id_occurred_at',
        columnNames: ['plan_id', 'occurred_at'],
      }),
    );

    // transaction_entries
    await queryRunner.createTable(
      new Table({
        name: 'transaction_entries',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          {
            name: 'transaction_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'account_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          { name: 'amount_cents', type: 'integer', isNullable: false },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
        checks: [new TableCheck({ expression: `amount_cents != 0` })],
      }),
    );

    await queryRunner.createIndex(
      'transaction_entries',
      new TableIndex({
        name: 'IDX_transaction_entries_transaction_id',
        columnNames: ['transaction_id'],
      }),
    );
    await queryRunner.createIndex(
      'transaction_entries',
      new TableIndex({
        name: 'IDX_transaction_entries_account_id',
        columnNames: ['account_id'],
      }),
    );

    // income_payments
    await queryRunner.createTable(
      new Table({
        name: 'income_payments',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          {
            name: 'income_source_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'income_schedule_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'transaction_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          { name: 'external_source', type: 'varchar', isNullable: true },
          { name: 'external_id', type: 'varchar', isNullable: true },
          { name: 'paid_on', type: 'date', isNullable: false },
          {
            name: 'payment_number_in_month',
            type: 'integer',
            isNullable: true,
          },
          { name: 'status', type: 'varchar', default: "'projected'" },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'income_payments',
      new TableIndex({
        name: 'IDX_income_payments_income_source_id',
        columnNames: ['income_source_id'],
      }),
    );
    await queryRunner.createUniqueConstraint(
      'income_payments',
      new TableUnique({
        name: 'UQ_income_payments_transaction_id',
        columnNames: ['transaction_id'],
      }),
    );

    // budget_periods
    await queryRunner.createTable(
      new Table({
        name: 'budget_periods',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'plan_id', type: 'varchar', length: '36', isNullable: false },
          {
            name: 'income_payment_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          { name: 'period_type', type: 'varchar', isNullable: false },
          { name: 'starts_on', type: 'date', isNullable: false },
          { name: 'ends_on', type: 'date', isNullable: false },
          { name: 'funding_amount_cents', type: 'integer', isNullable: false },
          { name: 'status', type: 'varchar', default: "'open'" },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
        checks: [
          new TableCheck({ expression: `ends_on >= starts_on` }),
          new TableCheck({ expression: `funding_amount_cents >= 0` }),
        ],
      }),
    );

    await queryRunner.createIndex(
      'budget_periods',
      new TableIndex({
        name: 'IDX_budget_periods_plan_id',
        columnNames: ['plan_id'],
      }),
    );

    // recurring_items
    await queryRunner.createTable(
      new Table({
        name: 'recurring_items',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'plan_id', type: 'varchar', length: '36', isNullable: false },
          {
            name: 'category_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'source_account_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'destination_account_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          { name: 'item_type', type: 'varchar', isNullable: false },
          { name: 'concept', type: 'varchar', isNullable: false },
          { name: 'amount_cents', type: 'integer', isNullable: false },
          { name: 'recurrence_rule', type: 'text', isNullable: false },
          { name: 'starts_on', type: 'date', isNullable: true },
          { name: 'ends_on', type: 'date', isNullable: true },
          { name: 'last_generated_on', type: 'date', isNullable: true },
          { name: 'active', type: 'boolean', default: '1' },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
        checks: [
          new TableCheck({ expression: `amount_cents != 0` }),
          new TableCheck({
            expression: `ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on`,
          }),
        ],
      }),
    );

    await queryRunner.createIndex(
      'recurring_items',
      new TableIndex({
        name: 'IDX_recurring_items_plan_id',
        columnNames: ['plan_id'],
      }),
    );

    // budget_items
    await queryRunner.createTable(
      new Table({
        name: 'budget_items',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          {
            name: 'budget_period_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          { name: 'external_id', type: 'varchar', isNullable: true },
          {
            name: 'recurring_item_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'category_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'source_account_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'destination_account_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          { name: 'due_on', type: 'date', isNullable: false },
          { name: 'concept', type: 'varchar', isNullable: false },
          { name: 'planned_amount_cents', type: 'integer', isNullable: false },
          { name: 'status', type: 'varchar', default: "'planned'" },
          { name: 'rollover_policy', type: 'varchar', default: "'expire'" },
          { name: 'notes', type: 'text', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
        checks: [new TableCheck({ expression: `planned_amount_cents >= 0` })],
      }),
    );

    await queryRunner.createIndex(
      'budget_items',
      new TableIndex({
        name: 'IDX_budget_items_budget_period_id_due_on',
        columnNames: ['budget_period_id', 'due_on'],
      }),
    );

    // budget_item_transactions (composite PK)
    await queryRunner.createTable(
      new Table({
        name: 'budget_item_transactions',
        columns: [
          {
            name: 'budget_item_id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'transaction_id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'allocated_amount_cents',
            type: 'integer',
            isNullable: false,
          },
        ],
        checks: [new TableCheck({ expression: `allocated_amount_cents > 0` })],
      }),
    );

    // debt_projection_runs
    await queryRunner.createTable(
      new Table({
        name: 'debt_projection_runs',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'plan_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'projected_from', type: 'date', isNullable: false },
          { name: 'generated_at', type: 'datetime', isNullable: false },
          { name: 'algorithm_version', type: 'varchar', isNullable: false },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
      }),
    );

    // debt_projection_points
    await queryRunner.createTable(
      new Table({
        name: 'debt_projection_points',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          {
            name: 'projection_run_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'account_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          { name: 'projected_on', type: 'date', isNullable: false },
          { name: 'balance_cents', type: 'integer', isNullable: false },
        ],
      }),
    );

    await queryRunner.createUniqueConstraint(
      'debt_projection_points',
      new TableUnique({
        name: 'UQ_debt_projection_points_run_id_account_id_projected_on',
        columnNames: ['projection_run_id', 'account_id', 'projected_on'],
      }),
    );

    // plan_settings
    await queryRunner.createTable(
      new Table({
        name: 'plan_settings',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'plan_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'key', type: 'varchar', isNullable: false },
          { name: 'value_json', type: 'text', isNullable: false },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
      }),
    );

    await queryRunner.createUniqueConstraint(
      'plan_settings',
      new TableUnique({
        name: 'UQ_plan_settings_plan_id_key',
        columnNames: ['plan_id', 'key'],
      }),
    );

    // summary_notes
    await queryRunner.createTable(
      new Table({
        name: 'summary_notes',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'plan_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'note', type: 'text', isNullable: false },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: "(datetime('now'))",
          },
        ],
      }),
    );

    // -----------------------------------------------------------------------
    // 2. Create foreign key constraints
    // -----------------------------------------------------------------------

    // allocation_categories -> financial_plans
    await queryRunner.createForeignKey(
      'allocation_categories',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedTableName: 'financial_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // financial_accounts -> financial_plans
    await queryRunner.createForeignKey(
      'financial_accounts',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedTableName: 'financial_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // liability_terms -> financial_accounts
    await queryRunner.createForeignKey(
      'liability_terms',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedTableName: 'financial_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // account_balance_snapshots -> financial_accounts
    await queryRunner.createForeignKey(
      'account_balance_snapshots',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedTableName: 'financial_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // income_sources -> financial_plans
    await queryRunner.createForeignKey(
      'income_sources',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedTableName: 'financial_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // income_sources -> financial_accounts (SET NULL)
    await queryRunner.createForeignKey(
      'income_sources',
      new TableForeignKey({
        columnNames: ['default_deposit_account_id'],
        referencedTableName: 'financial_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // income_schedules -> income_sources
    await queryRunner.createForeignKey(
      'income_schedules',
      new TableForeignKey({
        columnNames: ['income_source_id'],
        referencedTableName: 'income_sources',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // income_schedule_amount_rules -> income_schedules
    await queryRunner.createForeignKey(
      'income_schedule_amount_rules',
      new TableForeignKey({
        columnNames: ['income_schedule_id'],
        referencedTableName: 'income_schedules',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // transactions -> financial_plans
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedTableName: 'financial_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // transactions -> allocation_categories (NO ACTION)
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedTableName: 'allocation_categories',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );

    // transaction_entries -> transactions
    await queryRunner.createForeignKey(
      'transaction_entries',
      new TableForeignKey({
        columnNames: ['transaction_id'],
        referencedTableName: 'transactions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // transaction_entries -> financial_accounts (NO ACTION)
    await queryRunner.createForeignKey(
      'transaction_entries',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedTableName: 'financial_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );

    // income_payments -> income_sources
    await queryRunner.createForeignKey(
      'income_payments',
      new TableForeignKey({
        columnNames: ['income_source_id'],
        referencedTableName: 'income_sources',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // income_payments -> income_schedules (SET NULL)
    await queryRunner.createForeignKey(
      'income_payments',
      new TableForeignKey({
        columnNames: ['income_schedule_id'],
        referencedTableName: 'income_schedules',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // income_payments -> transactions (NO ACTION)
    await queryRunner.createForeignKey(
      'income_payments',
      new TableForeignKey({
        columnNames: ['transaction_id'],
        referencedTableName: 'transactions',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );

    // budget_periods -> financial_plans
    await queryRunner.createForeignKey(
      'budget_periods',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedTableName: 'financial_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // budget_periods -> income_payments (SET NULL)
    await queryRunner.createForeignKey(
      'budget_periods',
      new TableForeignKey({
        columnNames: ['income_payment_id'],
        referencedTableName: 'income_payments',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // recurring_items -> financial_plans
    await queryRunner.createForeignKey(
      'recurring_items',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedTableName: 'financial_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // recurring_items -> allocation_categories (NO ACTION)
    await queryRunner.createForeignKey(
      'recurring_items',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedTableName: 'allocation_categories',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );

    // recurring_items -> financial_accounts source (NO ACTION)
    await queryRunner.createForeignKey(
      'recurring_items',
      new TableForeignKey({
        columnNames: ['source_account_id'],
        referencedTableName: 'financial_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );

    // recurring_items -> financial_accounts destination (NO ACTION)
    await queryRunner.createForeignKey(
      'recurring_items',
      new TableForeignKey({
        columnNames: ['destination_account_id'],
        referencedTableName: 'financial_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );

    // budget_items -> budget_periods
    await queryRunner.createForeignKey(
      'budget_items',
      new TableForeignKey({
        columnNames: ['budget_period_id'],
        referencedTableName: 'budget_periods',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // budget_items -> recurring_items (SET NULL)
    await queryRunner.createForeignKey(
      'budget_items',
      new TableForeignKey({
        columnNames: ['recurring_item_id'],
        referencedTableName: 'recurring_items',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // budget_items -> allocation_categories (NO ACTION)
    await queryRunner.createForeignKey(
      'budget_items',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedTableName: 'allocation_categories',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );

    // budget_items -> financial_accounts source (NO ACTION)
    await queryRunner.createForeignKey(
      'budget_items',
      new TableForeignKey({
        columnNames: ['source_account_id'],
        referencedTableName: 'financial_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );

    // budget_items -> financial_accounts destination (NO ACTION)
    await queryRunner.createForeignKey(
      'budget_items',
      new TableForeignKey({
        columnNames: ['destination_account_id'],
        referencedTableName: 'financial_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );

    // budget_item_transactions -> budget_items
    await queryRunner.createForeignKey(
      'budget_item_transactions',
      new TableForeignKey({
        columnNames: ['budget_item_id'],
        referencedTableName: 'budget_items',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // budget_item_transactions -> transactions
    await queryRunner.createForeignKey(
      'budget_item_transactions',
      new TableForeignKey({
        columnNames: ['transaction_id'],
        referencedTableName: 'transactions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // debt_projection_runs -> financial_plans
    await queryRunner.createForeignKey(
      'debt_projection_runs',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedTableName: 'financial_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // debt_projection_points -> debt_projection_runs
    await queryRunner.createForeignKey(
      'debt_projection_points',
      new TableForeignKey({
        columnNames: ['projection_run_id'],
        referencedTableName: 'debt_projection_runs',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // debt_projection_points -> financial_accounts (NO ACTION)
    await queryRunner.createForeignKey(
      'debt_projection_points',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedTableName: 'financial_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );

    // plan_settings -> financial_plans
    await queryRunner.createForeignKey(
      'plan_settings',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedTableName: 'financial_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // summary_notes -> financial_plans
    await queryRunner.createForeignKey(
      'summary_notes',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedTableName: 'financial_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // -----------------------------------------------------------------------
    // 3. Create partial unique indexes for external IDs
    // -----------------------------------------------------------------------
    // These ensure that external_id values are unique per source when present.
    // SQLite supports partial unique indexes via the WHERE clause.

    // financial_accounts: unique (external_source, external_id) where external_id IS NOT NULL
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_financial_accounts_external
      ON financial_accounts(external_source, external_id)
      WHERE external_id IS NOT NULL
    `);

    // income_payments: unique (external_source, external_id) where external_id IS NOT NULL
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_income_payments_external
      ON income_payments(external_source, external_id)
      WHERE external_id IS NOT NULL
    `);

    // transactions: unique (external_source, external_id) where external_id IS NOT NULL
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_transactions_external
      ON transactions(external_source, external_id)
      WHERE external_id IS NOT NULL
    `);

    // budget_items: unique (external_id) where external_id IS NOT NULL
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_budget_items_external
      ON budget_items(external_id)
      WHERE external_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop partial unique indexes first
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_financial_accounts_external`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_income_payments_external`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_transactions_external`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_budget_items_external`);

    // Drop tables in reverse dependency order
    await queryRunner.dropTable('summary_notes');
    await queryRunner.dropTable('plan_settings');
    await queryRunner.dropTable('debt_projection_points');
    await queryRunner.dropTable('debt_projection_runs');
    await queryRunner.dropTable('budget_item_transactions');
    await queryRunner.dropTable('budget_items');
    await queryRunner.dropTable('recurring_items');
    await queryRunner.dropTable('budget_periods');
    await queryRunner.dropTable('income_payments');
    await queryRunner.dropTable('transaction_entries');
    await queryRunner.dropTable('transactions');
    await queryRunner.dropTable('income_schedule_amount_rules');
    await queryRunner.dropTable('income_schedules');
    await queryRunner.dropTable('income_sources');
    await queryRunner.dropTable('account_balance_snapshots');
    await queryRunner.dropTable('liability_terms');
    await queryRunner.dropTable('financial_accounts');
    await queryRunner.dropTable('allocation_categories');
    await queryRunner.dropTable('financial_plans');
  }
}
