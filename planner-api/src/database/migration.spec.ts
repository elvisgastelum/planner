import { DataSource, QueryRunner } from 'typeorm';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';

import { plannerEntities } from '../planner/entities';
import { InitialNormalizedPlannerSchema1781376302095 } from '../database/migrations/1781376302095-InitialNormalizedPlannerSchema';

describe('Migration: InitialNormalizedPlannerSchema', () => {
  let tempDbPath: string;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    // Create a temporary database file path
    tempDbPath = join(process.cwd(), `test-migration-${Date.now()}.sqlite`);

    // Create DataSource with the same config as AppDataSource
    dataSource = new DataSource({
      type: 'sqlite',
      database: tempDbPath,
      entities: plannerEntities,
      migrations: [InitialNormalizedPlannerSchema1781376302095],
      synchronize: false,
      logging: false,
    });

    await dataSource.initialize();
    queryRunner = dataSource.createQueryRunner();
  });

  afterEach(async () => {
    // Clean up
    if (queryRunner) {
      await queryRunner.release();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }

    // Delete temp file
    try {
      unlinkSync(tempDbPath);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  it('should create all normalized tables', async () => {
    // Run the migration
    await dataSource.runMigrations();

    // Expected tables
    const expectedTables = [
      'financial_plans',
      'allocation_categories',
      'financial_accounts',
      'liability_terms',
      'account_balance_snapshots',
      'income_sources',
      'income_schedules',
      'income_schedule_amount_rules',
      'transactions',
      'transaction_entries',
      'income_payments',
      'budget_periods',
      'recurring_items',
      'budget_items',
      'budget_item_transactions',
      'debt_projection_runs',
      'debt_projection_points',
      'plan_settings',
      'summary_notes',
      'migrations', // TypeORM migrations table
    ];

    for (const table of expectedTables) {
      const result = await queryRunner.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [table],
      );
      expect(result.length).toBe(1);
    }
  });

  it('should not have obsolete tables', async () => {
    await dataSource.runMigrations();

    // Obsolete table names from old schema
    const obsoleteTables = [
      'accounts',
      'payment_periods',
      'payment_period_items',
      'recurring_expenses',
      'recurring_expense_days',
      'completed_items',
      'pre_income_allocations',
      'pre_income_allocation_items',
      'current_account_balances',
      'current_debt_balances',
      'debt_projection_snapshots',
      'debt_projection_balances',
      'plan_rules',
    ];

    for (const table of obsoleteTables) {
      const result = await queryRunner.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [table],
      );
      expect(result.length).toBe(0);
    }
  });

  it('should pass foreign key check', async () => {
    await dataSource.runMigrations();

    // Enable foreign keys
    await queryRunner.query('PRAGMA foreign_keys = ON');

    // Insert test data to verify FK constraints work
    const planId = 'test-plan-id';
    await queryRunner.query(
      `INSERT INTO financial_plans (id, metadata_id, name, base_currency, start_date, status)
       VALUES (?, ?, 'Test Plan', 'MXN', '2024-01-01', 'active')`,
      [planId, 'test-metadata'],
    );

    // Verify foreign key check passes (no violations)
    const fkCheck = await queryRunner.query('PRAGMA foreign_key_check');
    expect(fkCheck).toEqual([]);
  });

  it('should pass integrity check', async () => {
    await dataSource.runMigrations();

    // Run integrity check
    const integrityCheck = await queryRunner.query('PRAGMA integrity_check');

    // SQLite returns ['ok'] on success
    expect(integrityCheck[0].integrity_check || integrityCheck[0]).toBe('ok');
  });

  it('should have correct indexes', async () => {
    await dataSource.runMigrations();

    // Check for specific indexes
    const indexes = await queryRunner.query(
      `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='financial_plans'`,
    );

    const indexNames = indexes.map((idx: any) => idx.name);
    expect(indexNames).toContain('IDX_financial_plans_metadata_id');
  });

  it('should have correct unique constraints', async () => {
    await dataSource.runMigrations();

    // Try to insert duplicate metadata_id (should fail)
    await queryRunner.query(
      `INSERT INTO financial_plans (id, metadata_id, name, base_currency, start_date, status)
       VALUES ('id1', 'dup-metadata', 'Plan 1', 'MXN', '2024-01-01', 'active')`,
    );

    await expect(
      queryRunner.query(
        `INSERT INTO financial_plans (id, metadata_id, name, base_currency, start_date, status)
         VALUES ('id2', 'dup-metadata', 'Plan 2', 'MXN', '2024-01-01', 'active')`,
      ),
    ).rejects.toThrow();
  });
});
