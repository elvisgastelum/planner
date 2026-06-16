import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class InitialPlannerSchema1781376302095 implements MigrationInterface {
  name = 'InitialPlannerSchema1781376302095';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create financial_plans table (no foreign keys)
    await queryRunner.createTable(
      new Table({
        name: 'financial_plans',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({
            name: 'metadata_id',
            type: 'varchar',
            isNullable: false,
          }),
          new TableColumn({
            name: 'schema_version',
            type: 'varchar',
            isNullable: false,
            default: "'1.0.0'",
          }),
          new TableColumn({ name: 'name', type: 'varchar', isNullable: false }),
          new TableColumn({
            name: 'currency',
            type: 'varchar',
            isNullable: false,
            default: "'MXN'",
          }),
          new TableColumn({
            name: 'start_date',
            type: 'date',
            isNullable: false,
          }),
          new TableColumn({ name: 'end_date', type: 'date', isNullable: true }),
          new TableColumn({
            name: 'status',
            type: 'varchar',
            isNullable: false,
            default: "'active'",
          }),
          new TableColumn({
            name: 'objective',
            type: 'text',
            isNullable: true,
          }),
          new TableColumn({
            name: 'projected_debt_free_date',
            type: 'date',
            isNullable: true,
          }),
          new TableColumn({
            name: 'projected_emergency_fund',
            type: 'real',
            isNullable: true,
          }),
          new TableColumn({
            name: 'created_at',
            type: 'datetime',
            isNullable: false,
            default: "(datetime('now'))",
          }),
          new TableColumn({
            name: 'updated_at',
            type: 'datetime',
            isNullable: false,
            default: "(datetime('now'))",
          }),
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_c7c1a01e29a56b87e280cfb33c5',
            columnNames: ['metadata_id'],
          }),
        ],
      }),
      true,
    );

    // Create allocation_categories table
    await queryRunner.createTable(
      new Table({
        name: 'allocation_categories',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({ name: 'key', type: 'varchar', isNullable: false }),
          new TableColumn({ name: 'name', type: 'varchar', isNullable: false }),
          new TableColumn({
            name: 'percentage',
            type: 'real',
            isNullable: false,
          }),
          new TableColumn({
            name: 'description',
            type: 'text',
            isNullable: true,
          }),
          new TableColumn({
            name: 'planId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_652f89105bf3f9d51193701ff7e',
            columnNames: ['planId'],
            referencedTableName: 'financial_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_4ee3934ef0d1de5dc0b47bb4efc',
            columnNames: ['planId', 'key'],
          }),
        ],
      }),
      true,
    );

    // Create accounts table
    await queryRunner.createTable(
      new Table({
        name: 'accounts',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({
            name: 'external_id',
            type: 'varchar',
            isNullable: false,
          }),
          new TableColumn({ name: 'name', type: 'varchar', isNullable: false }),
          new TableColumn({ name: 'type', type: 'varchar', isNullable: false }),
          new TableColumn({
            name: 'planId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_9c2217745e2047def253ac8e0ad',
            columnNames: ['planId'],
            referencedTableName: 'financial_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_8c3ae1b8938ad67b924a6ca7b05',
            columnNames: ['planId', 'external_id'],
          }),
        ],
      }),
      true,
    );

    // Create income_schedules table
    await queryRunner.createTable(
      new Table({
        name: 'income_schedules',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({
            name: 'cadence',
            type: 'varchar',
            isNullable: false,
          }),
          new TableColumn({
            name: 'anchor_payment_date',
            type: 'date',
            isNullable: false,
          }),
          new TableColumn({
            name: 'currency',
            type: 'varchar',
            isNullable: false,
            default: "'MXN'",
          }),
          new TableColumn({
            name: 'ordinary_month_gross_income',
            type: 'real',
            isNullable: true,
          }),
          new TableColumn({
            name: 'ordinary_month_net_reference',
            type: 'real',
            isNullable: true,
          }),
          new TableColumn({
            name: 'generated_through',
            type: 'date',
            isNullable: true,
          }),
          new TableColumn({
            name: 'generation_method',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'calculation_rule',
            type: 'text',
            isNullable: true,
          }),
          new TableColumn({
            name: 'plan_id',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_b408b2489357e3ac79a59ce816c',
            columnNames: ['plan_id'],
            referencedTableName: 'financial_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
        uniques: [
          new TableUnique({
            name: 'REL_b408b2489357e3ac79a59ce816',
            columnNames: ['plan_id'],
          }),
        ],
      }),
      true,
    );

    // Create income_schedule_amount_rules table
    await queryRunner.createTable(
      new Table({
        name: 'income_schedule_amount_rules',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({
            name: 'payment_number_in_month',
            type: 'integer',
            isNullable: false,
          }),
          new TableColumn({ name: 'amount', type: 'real', isNullable: false }),
          new TableColumn({
            name: 'currency',
            type: 'varchar',
            isNullable: false,
            default: "'MXN'",
          }),
          new TableColumn({
            name: 'incomeScheduleId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_49ff7dac7ea3a26974a4a8d5158',
            columnNames: ['incomeScheduleId'],
            referencedTableName: 'income_schedules',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_1b0477e8bb636ffd3ba48cf841e',
            columnNames: ['incomeScheduleId', 'payment_number_in_month'],
          }),
        ],
      }),
      true,
    );

    // Create income_payments table
    await queryRunner.createTable(
      new Table({
        name: 'income_payments',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({
            name: 'external_id',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({ name: 'date', type: 'date', isNullable: false }),
          new TableColumn({
            name: 'month',
            type: 'varchar',
            isNullable: false,
          }),
          new TableColumn({
            name: 'payment_number_in_month',
            type: 'integer',
            isNullable: false,
          }),
          new TableColumn({ name: 'amount', type: 'real', isNullable: false }),
          new TableColumn({
            name: 'currency',
            type: 'varchar',
            isNullable: false,
            default: "'MXN'",
          }),
          new TableColumn({
            name: 'status',
            type: 'varchar',
            isNullable: false,
            default: "'projected'",
          }),
          new TableColumn({
            name: 'source',
            type: 'varchar',
            isNullable: false,
            default: "'manual'",
          }),
          new TableColumn({
            name: 'planId',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'incomeScheduleId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_6481cae0dea125175ad34819d55',
            columnNames: ['planId'],
            referencedTableName: 'financial_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
          new TableForeignKey({
            name: 'FK_27cf4c258a1e70a76d911fb5abf',
            columnNames: ['incomeScheduleId'],
            referencedTableName: 'income_schedules',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            onUpdate: 'NO ACTION',
          }),
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_03282b20c1e31a88f87548f166d',
            columnNames: ['planId', 'external_id'],
          }),
        ],
      }),
      true,
    );

    // Create payment_periods table
    await queryRunner.createTable(
      new Table({
        name: 'payment_periods',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({
            name: 'external_id',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'income_date',
            type: 'date',
            isNullable: false,
          }),
          new TableColumn({
            name: 'planned_total',
            type: 'real',
            isNullable: false,
            default: '0',
          }),
          new TableColumn({
            name: 'planned_remaining',
            type: 'real',
            isNullable: false,
            default: '0',
          }),
          new TableColumn({
            name: 'planId',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'income_payment_id',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_19f9c91a86eb2ac6bb06ae595af',
            columnNames: ['planId'],
            referencedTableName: 'financial_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
          new TableForeignKey({
            name: 'FK_9b43d995342520f51f2ee0fe7dc',
            columnNames: ['income_payment_id'],
            referencedTableName: 'income_payments',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            onUpdate: 'NO ACTION',
          }),
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_d3be129c1d6952edaad3b6a36ee',
            columnNames: ['planId', 'external_id'],
          }),
          new TableUnique({
            name: 'REL_9b43d995342520f51f2ee0fe7d',
            columnNames: ['income_payment_id'],
          }),
        ],
      }),
      true,
    );

    // Create payment_period_items table
    await queryRunner.createTable(
      new Table({
        name: 'payment_period_items',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({
            name: 'external_id',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({ name: 'date', type: 'date', isNullable: false }),
          new TableColumn({
            name: 'concept',
            type: 'varchar',
            isNullable: false,
          }),
          new TableColumn({
            name: 'planned_amount',
            type: 'real',
            isNullable: false,
          }),
          new TableColumn({
            name: 'actual_amount',
            type: 'real',
            isNullable: true,
          }),
          new TableColumn({
            name: 'category',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'account',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'funding_account',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'status',
            type: 'varchar',
            isNullable: false,
            default: "'pending'",
          }),
          new TableColumn({
            name: 'completed_at',
            type: 'datetime',
            isNullable: true,
          }),
          new TableColumn({ name: 'notes', type: 'text', isNullable: true }),
          new TableColumn({
            name: 'non_rollover',
            type: 'boolean',
            isNullable: false,
            default: '0',
          }),
          new TableColumn({
            name: 'treated_as_spent_if_unused',
            type: 'boolean',
            isNullable: false,
            default: '0',
          }),
          new TableColumn({
            name: 'paymentPeriodId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_6b523a2634c0fbe5dda53b9b11e',
            columnNames: ['paymentPeriodId'],
            referencedTableName: 'payment_periods',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_be54640c7e55702f119c25fe8ef',
            columnNames: ['paymentPeriodId', 'external_id'],
          }),
        ],
      }),
      true,
    );

    // Create recurring_expenses table
    await queryRunner.createTable(
      new Table({
        name: 'recurring_expenses',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({
            name: 'concept',
            type: 'varchar',
            isNullable: false,
          }),
          new TableColumn({ name: 'amount', type: 'real', isNullable: false }),
          new TableColumn({
            name: 'frequency',
            type: 'varchar',
            isNullable: false,
          }),
          new TableColumn({ name: 'day', type: 'integer', isNullable: true }),
          new TableColumn({ name: 'date', type: 'date', isNullable: true }),
          new TableColumn({
            name: 'day_rule',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'custom_interval_unit',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'account',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'funding_account',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'category',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'non_rollover',
            type: 'boolean',
            isNullable: false,
            default: '0',
          }),
          new TableColumn({
            name: 'last_payment_date',
            type: 'date',
            isNullable: true,
          }),
          new TableColumn({
            name: 'last_payment_amount',
            type: 'real',
            isNullable: true,
          }),
          new TableColumn({
            name: 'planId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_b3cc995a62843e0ff7f525e623c',
            columnNames: ['planId'],
            referencedTableName: 'financial_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
      }),
      true,
    );

    // Create recurring_expense_days table
    await queryRunner.createTable(
      new Table({
        name: 'recurring_expense_days',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({ name: 'day', type: 'integer', isNullable: false }),
          new TableColumn({
            name: 'recurringExpenseId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_1ad1a5f0bf26768fa6d8e68b295',
            columnNames: ['recurringExpenseId'],
            referencedTableName: 'recurring_expenses',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
      }),
      true,
    );

    // Create completed_items table
    await queryRunner.createTable(
      new Table({
        name: 'completed_items',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({
            name: 'external_id',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({ name: 'date', type: 'date', isNullable: false }),
          new TableColumn({
            name: 'concept',
            type: 'varchar',
            isNullable: false,
          }),
          new TableColumn({ name: 'amount', type: 'real', isNullable: false }),
          new TableColumn({ name: 'type', type: 'varchar', isNullable: true }),
          new TableColumn({
            name: 'category',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'from_account',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'to_account',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'account',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'status',
            type: 'varchar',
            isNullable: false,
            default: "'completed'",
          }),
          new TableColumn({
            name: 'planId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_a2cf428381c76ec174313eddae4',
            columnNames: ['planId'],
            referencedTableName: 'financial_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_59df08c7c4321d7cd376fff0d90',
            columnNames: ['planId', 'external_id'],
          }),
        ],
      }),
      true,
    );

    // Create pre_income_allocations table
    await queryRunner.createTable(
      new Table({
        name: 'pre_income_allocations',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({
            name: 'available_amount',
            type: 'real',
            isNullable: false,
          }),
          new TableColumn({
            name: 'period_end',
            type: 'date',
            isNullable: false,
          }),
          new TableColumn({
            name: 'plan_id',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_9c23caab35c9f3038209811468c',
            columnNames: ['plan_id'],
            referencedTableName: 'financial_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
        uniques: [
          new TableUnique({
            name: 'REL_9c23caab35c9f3038209811468',
            columnNames: ['plan_id'],
          }),
        ],
      }),
      true,
    );

    // Create pre_income_allocation_items table
    await queryRunner.createTable(
      new Table({
        name: 'pre_income_allocation_items',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({
            name: 'external_id',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({ name: 'date', type: 'date', isNullable: false }),
          new TableColumn({
            name: 'concept',
            type: 'varchar',
            isNullable: false,
          }),
          new TableColumn({ name: 'amount', type: 'real', isNullable: false }),
          new TableColumn({
            name: 'category',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'account',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'status',
            type: 'varchar',
            isNullable: false,
            default: "'pending'",
          }),
          new TableColumn({
            name: 'non_rollover',
            type: 'boolean',
            isNullable: false,
            default: '0',
          }),
          new TableColumn({
            name: 'preIncomeAllocationId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_5e9f689e3435ed993bb1b628a7d',
            columnNames: ['preIncomeAllocationId'],
            referencedTableName: 'pre_income_allocations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
      }),
      true,
    );

    // Create current_account_balances table
    await queryRunner.createTable(
      new Table({
        name: 'current_account_balances',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({ name: 'as_of', type: 'date', isNullable: false }),
          new TableColumn({
            name: 'account_name',
            type: 'varchar',
            isNullable: false,
          }),
          new TableColumn({ name: 'amount', type: 'real', isNullable: false }),
          new TableColumn({
            name: 'currency',
            type: 'varchar',
            isNullable: false,
            default: "'MXN'",
          }),
          new TableColumn({
            name: 'planId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_2bc08d49ebc93d8a793c0de3580',
            columnNames: ['planId'],
            referencedTableName: 'financial_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
      }),
      true,
    );

    // Create current_debt_balances table
    await queryRunner.createTable(
      new Table({
        name: 'current_debt_balances',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({ name: 'as_of', type: 'date', isNullable: false }),
          new TableColumn({
            name: 'debt_name',
            type: 'varchar',
            isNullable: false,
          }),
          new TableColumn({ name: 'amount', type: 'real', isNullable: false }),
          new TableColumn({
            name: 'currency',
            type: 'varchar',
            isNullable: false,
            default: "'MXN'",
          }),
          new TableColumn({
            name: 'planId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_cf0c3209d36260edc5bc2b736c5',
            columnNames: ['planId'],
            referencedTableName: 'financial_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
      }),
      true,
    );

    // Create debt_projection_snapshots table
    await queryRunner.createTable(
      new Table({
        name: 'debt_projection_snapshots',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({ name: 'date', type: 'date', isNullable: false }),
          new TableColumn({
            name: 'planId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_c9fce7a82e63be9c01f0778a127',
            columnNames: ['planId'],
            referencedTableName: 'financial_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
      }),
      true,
    );

    // Create debt_projection_balances table
    await queryRunner.createTable(
      new Table({
        name: 'debt_projection_balances',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({
            name: 'account_name',
            type: 'varchar',
            isNullable: false,
          }),
          new TableColumn({ name: 'amount', type: 'real', isNullable: false }),
          new TableColumn({
            name: 'snapshotId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_cfcc12c3bc370cb922881f9ed9d',
            columnNames: ['snapshotId'],
            referencedTableName: 'debt_projection_snapshots',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
      }),
      true,
    );

    // Create plan_rules table
    await queryRunner.createTable(
      new Table({
        name: 'plan_rules',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({ name: 'key', type: 'varchar', isNullable: false }),
          new TableColumn({
            name: 'value_json',
            type: 'text',
            isNullable: false,
          }),
          new TableColumn({
            name: 'planId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_6c24d214c04fffd08ea41b1fd4e',
            columnNames: ['planId'],
            referencedTableName: 'financial_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_eeca99a747afcec015302471a7f',
            columnNames: ['planId', 'key'],
          }),
        ],
      }),
      true,
    );

    // Create summary_notes table
    await queryRunner.createTable(
      new Table({
        name: 'summary_notes',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isNullable: false,
          }),
          new TableColumn({ name: 'note', type: 'text', isNullable: false }),
          new TableColumn({
            name: 'planId',
            type: 'varchar',
            isNullable: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_ea316f89c3504027e360c0abbf8',
            columnNames: ['planId'],
            referencedTableName: 'financial_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (children first, then parents)
    // This preserves the schema exactly by removing dependent tables before their referenced tables
    await queryRunner.dropTable('summary_notes', true);
    await queryRunner.dropTable('plan_rules', true);
    await queryRunner.dropTable('debt_projection_balances', true);
    await queryRunner.dropTable('debt_projection_snapshots', true);
    await queryRunner.dropTable('current_debt_balances', true);
    await queryRunner.dropTable('current_account_balances', true);
    await queryRunner.dropTable('pre_income_allocation_items', true);
    await queryRunner.dropTable('pre_income_allocations', true);
    await queryRunner.dropTable('completed_items', true);
    await queryRunner.dropTable('recurring_expense_days', true);
    await queryRunner.dropTable('recurring_expenses', true);
    await queryRunner.dropTable('payment_period_items', true);
    await queryRunner.dropTable('payment_periods', true);
    await queryRunner.dropTable('income_payments', true);
    await queryRunner.dropTable('income_schedule_amount_rules', true);
    await queryRunner.dropTable('income_schedules', true);
    await queryRunner.dropTable('accounts', true);
    await queryRunner.dropTable('allocation_categories', true);
    await queryRunner.dropTable('financial_plans', true);
  }
}
