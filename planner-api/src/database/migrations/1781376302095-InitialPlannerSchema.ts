import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialPlannerSchema1781376302095 implements MigrationInterface {
  name = 'InitialPlannerSchema1781376302095';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "financial_plans" ("id" varchar PRIMARY KEY NOT NULL, "metadata_id" varchar NOT NULL, "schema_version" varchar NOT NULL DEFAULT ('1.0.0'), "name" varchar NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "start_date" date NOT NULL, "end_date" date, "status" varchar NOT NULL DEFAULT ('active'), "objective" text, "projected_debt_free_date" date, "projected_emergency_fund" real, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_c7c1a01e29a56b87e280cfb33c5" UNIQUE ("metadata_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "allocation_categories" ("id" varchar PRIMARY KEY NOT NULL, "key" varchar NOT NULL, "name" varchar NOT NULL, "percentage" real NOT NULL, "description" text, "planId" varchar, CONSTRAINT "UQ_4ee3934ef0d1de5dc0b47bb4efc" UNIQUE ("planId", "key"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "accounts" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar NOT NULL, "name" varchar NOT NULL, "type" varchar NOT NULL, "planId" varchar, CONSTRAINT "UQ_8c3ae1b8938ad67b924a6ca7b05" UNIQUE ("planId", "external_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "income_schedules" ("id" varchar PRIMARY KEY NOT NULL, "cadence" varchar NOT NULL, "anchor_payment_date" date NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "ordinary_month_gross_income" real, "ordinary_month_net_reference" real, "generated_through" date, "generation_method" varchar, "calculation_rule" text, "plan_id" varchar, CONSTRAINT "REL_b408b2489357e3ac79a59ce816" UNIQUE ("plan_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "income_schedule_amount_rules" ("id" varchar PRIMARY KEY NOT NULL, "payment_number_in_month" integer NOT NULL, "amount" real NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "incomeScheduleId" varchar, CONSTRAINT "UQ_1b0477e8bb636ffd3ba48cf841e" UNIQUE ("incomeScheduleId", "payment_number_in_month"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "income_payments" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "date" date NOT NULL, "month" varchar NOT NULL, "payment_number_in_month" integer NOT NULL, "amount" real NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "status" varchar NOT NULL DEFAULT ('projected'), "source" varchar NOT NULL DEFAULT ('manual'), "planId" varchar, "incomeScheduleId" varchar, CONSTRAINT "UQ_03282b20c1e31a88f87548f166d" UNIQUE ("planId", "external_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "payment_periods" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "income_date" date NOT NULL, "planned_total" real NOT NULL DEFAULT (0), "planned_remaining" real NOT NULL DEFAULT (0), "planId" varchar, "income_payment_id" varchar, CONSTRAINT "UQ_d3be129c1d6952edaad3b6a36ee" UNIQUE ("planId", "external_id"), CONSTRAINT "REL_9b43d995342520f51f2ee0fe7d" UNIQUE ("income_payment_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "payment_period_items" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "date" date NOT NULL, "concept" varchar NOT NULL, "planned_amount" real NOT NULL, "actual_amount" real, "category" varchar, "account" varchar, "funding_account" varchar, "status" varchar NOT NULL DEFAULT ('pending'), "completed_at" datetime, "notes" text, "non_rollover" boolean NOT NULL DEFAULT (0), "treated_as_spent_if_unused" boolean NOT NULL DEFAULT (0), "paymentPeriodId" varchar, CONSTRAINT "UQ_be54640c7e55702f119c25fe8ef" UNIQUE ("paymentPeriodId", "external_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "recurring_expenses" ("id" varchar PRIMARY KEY NOT NULL, "concept" varchar NOT NULL, "amount" real NOT NULL, "frequency" varchar NOT NULL, "day" integer, "date" date, "day_rule" varchar, "custom_interval_unit" varchar, "account" varchar, "funding_account" varchar, "category" varchar, "non_rollover" boolean NOT NULL DEFAULT (0), "last_payment_date" date, "last_payment_amount" real, "planId" varchar)`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "recurring_expense_days" ("id" varchar PRIMARY KEY NOT NULL, "day" integer NOT NULL, "recurringExpenseId" varchar)`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "completed_items" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "date" date NOT NULL, "concept" varchar NOT NULL, "amount" real NOT NULL, "type" varchar, "category" varchar, "from_account" varchar, "to_account" varchar, "account" varchar, "status" varchar NOT NULL DEFAULT ('completed'), "planId" varchar, CONSTRAINT "UQ_59df08c7c4321d7cd376fff0d90" UNIQUE ("planId", "external_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "pre_income_allocations" ("id" varchar PRIMARY KEY NOT NULL, "available_amount" real NOT NULL, "period_end" date NOT NULL, "plan_id" varchar, CONSTRAINT "REL_9c23caab35c9f3038209811468" UNIQUE ("plan_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "pre_income_allocation_items" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "date" date NOT NULL, "concept" varchar NOT NULL, "amount" real NOT NULL, "category" varchar, "account" varchar, "status" varchar NOT NULL DEFAULT ('pending'), "non_rollover" boolean NOT NULL DEFAULT (0), "preIncomeAllocationId" varchar)`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "current_account_balances" ("id" varchar PRIMARY KEY NOT NULL, "as_of" date NOT NULL, "account_name" varchar NOT NULL, "amount" real NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "planId" varchar)`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "current_debt_balances" ("id" varchar PRIMARY KEY NOT NULL, "as_of" date NOT NULL, "debt_name" varchar NOT NULL, "amount" real NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "planId" varchar)`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "debt_projection_snapshots" ("id" varchar PRIMARY KEY NOT NULL, "date" date NOT NULL, "planId" varchar)`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "debt_projection_balances" ("id" varchar PRIMARY KEY NOT NULL, "account_name" varchar NOT NULL, "amount" real NOT NULL, "snapshotId" varchar)`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "plan_rules" ("id" varchar PRIMARY KEY NOT NULL, "key" varchar NOT NULL, "value_json" text NOT NULL, "planId" varchar, CONSTRAINT "UQ_eeca99a747afcec015302471a7f" UNIQUE ("planId", "key"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "summary_notes" ("id" varchar PRIMARY KEY NOT NULL, "note" text NOT NULL, "planId" varchar)`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_allocation_categories" ("id" varchar PRIMARY KEY NOT NULL, "key" varchar NOT NULL, "name" varchar NOT NULL, "percentage" real NOT NULL, "description" text, "planId" varchar, CONSTRAINT "UQ_4ee3934ef0d1de5dc0b47bb4efc" UNIQUE ("planId", "key"), CONSTRAINT "FK_652f89105bf3f9d51193701ff7e" FOREIGN KEY ("planId") REFERENCES "financial_plans" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_allocation_categories"("id", "key", "name", "percentage", "description", "planId") SELECT "id", "key", "name", "percentage", "description", "planId" FROM "allocation_categories"`,
    );
    await queryRunner.query(`DROP TABLE "allocation_categories"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_allocation_categories" RENAME TO "allocation_categories"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_accounts" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar NOT NULL, "name" varchar NOT NULL, "type" varchar NOT NULL, "planId" varchar, CONSTRAINT "UQ_8c3ae1b8938ad67b924a6ca7b05" UNIQUE ("planId", "external_id"), CONSTRAINT "FK_9c2217745e2047def253ac8e0ad" FOREIGN KEY ("planId") REFERENCES "financial_plans" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_accounts"("id", "external_id", "name", "type", "planId") SELECT "id", "external_id", "name", "type", "planId" FROM "accounts"`,
    );
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_accounts" RENAME TO "accounts"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_income_schedules" ("id" varchar PRIMARY KEY NOT NULL, "cadence" varchar NOT NULL, "anchor_payment_date" date NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "ordinary_month_gross_income" real, "ordinary_month_net_reference" real, "generated_through" date, "generation_method" varchar, "calculation_rule" text, "plan_id" varchar, CONSTRAINT "REL_b408b2489357e3ac79a59ce816" UNIQUE ("plan_id"), CONSTRAINT "FK_b408b2489357e3ac79a59ce816c" FOREIGN KEY ("plan_id") REFERENCES "financial_plans" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_income_schedules"("id", "cadence", "anchor_payment_date", "currency", "ordinary_month_gross_income", "ordinary_month_net_reference", "generated_through", "generation_method", "calculation_rule", "plan_id") SELECT "id", "cadence", "anchor_payment_date", "currency", "ordinary_month_gross_income", "ordinary_month_net_reference", "generated_through", "generation_method", "calculation_rule", "plan_id" FROM "income_schedules"`,
    );
    await queryRunner.query(`DROP TABLE "income_schedules"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_income_schedules" RENAME TO "income_schedules"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_income_schedule_amount_rules" ("id" varchar PRIMARY KEY NOT NULL, "payment_number_in_month" integer NOT NULL, "amount" real NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "incomeScheduleId" varchar, CONSTRAINT "UQ_1b0477e8bb636ffd3ba48cf841e" UNIQUE ("incomeScheduleId", "payment_number_in_month"), CONSTRAINT "FK_49ff7dac7ea3a26974a4a8d5158" FOREIGN KEY ("incomeScheduleId") REFERENCES "income_schedules" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_income_schedule_amount_rules"("id", "payment_number_in_month", "amount", "currency", "incomeScheduleId") SELECT "id", "payment_number_in_month", "amount", "currency", "incomeScheduleId" FROM "income_schedule_amount_rules"`,
    );
    await queryRunner.query(`DROP TABLE "income_schedule_amount_rules"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_income_schedule_amount_rules" RENAME TO "income_schedule_amount_rules"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_income_payments" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "date" date NOT NULL, "month" varchar NOT NULL, "payment_number_in_month" integer NOT NULL, "amount" real NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "status" varchar NOT NULL DEFAULT ('projected'), "source" varchar NOT NULL DEFAULT ('manual'), "planId" varchar, "incomeScheduleId" varchar, CONSTRAINT "UQ_03282b20c1e31a88f87548f166d" UNIQUE ("planId", "external_id"), CONSTRAINT "FK_6481cae0dea125175ad34819d55" FOREIGN KEY ("planId") REFERENCES "financial_plans" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_27cf4c258a1e70a76d911fb5abf" FOREIGN KEY ("incomeScheduleId") REFERENCES "income_schedules" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_income_payments"("id", "external_id", "date", "month", "payment_number_in_month", "amount", "currency", "status", "source", "planId", "incomeScheduleId") SELECT "id", "external_id", "date", "month", "payment_number_in_month", "amount", "currency", "status", "source", "planId", "incomeScheduleId" FROM "income_payments"`,
    );
    await queryRunner.query(`DROP TABLE "income_payments"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_income_payments" RENAME TO "income_payments"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_payment_periods" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "income_date" date NOT NULL, "planned_total" real NOT NULL DEFAULT (0), "planned_remaining" real NOT NULL DEFAULT (0), "planId" varchar, "income_payment_id" varchar, CONSTRAINT "UQ_d3be129c1d6952edaad3b6a36ee" UNIQUE ("planId", "external_id"), CONSTRAINT "REL_9b43d995342520f51f2ee0fe7d" UNIQUE ("income_payment_id"), CONSTRAINT "FK_19f9c91a86eb2ac6bb06ae595af" FOREIGN KEY ("planId") REFERENCES "financial_plans" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9b43d995342520f51f2ee0fe7dc" FOREIGN KEY ("income_payment_id") REFERENCES "income_payments" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_payment_periods"("id", "external_id", "income_date", "planned_total", "planned_remaining", "planId", "income_payment_id") SELECT "id", "external_id", "income_date", "planned_total", "planned_remaining", "planId", "income_payment_id" FROM "payment_periods"`,
    );
    await queryRunner.query(`DROP TABLE "payment_periods"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_payment_periods" RENAME TO "payment_periods"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_payment_period_items" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "date" date NOT NULL, "concept" varchar NOT NULL, "planned_amount" real NOT NULL, "actual_amount" real, "category" varchar, "account" varchar, "funding_account" varchar, "status" varchar NOT NULL DEFAULT ('pending'), "completed_at" datetime, "notes" text, "non_rollover" boolean NOT NULL DEFAULT (0), "treated_as_spent_if_unused" boolean NOT NULL DEFAULT (0), "paymentPeriodId" varchar, CONSTRAINT "UQ_be54640c7e55702f119c25fe8ef" UNIQUE ("paymentPeriodId", "external_id"), CONSTRAINT "FK_6b523a2634c0fbe5dda53b9b11e" FOREIGN KEY ("paymentPeriodId") REFERENCES "payment_periods" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_payment_period_items"("id", "external_id", "date", "concept", "planned_amount", "actual_amount", "category", "account", "funding_account", "status", "completed_at", "notes", "non_rollover", "treated_as_spent_if_unused", "paymentPeriodId") SELECT "id", "external_id", "date", "concept", "planned_amount", "actual_amount", "category", "account", "funding_account", "status", "completed_at", "notes", "non_rollover", "treated_as_spent_if_unused", "paymentPeriodId" FROM "payment_period_items"`,
    );
    await queryRunner.query(`DROP TABLE "payment_period_items"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_payment_period_items" RENAME TO "payment_period_items"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_recurring_expenses" ("id" varchar PRIMARY KEY NOT NULL, "concept" varchar NOT NULL, "amount" real NOT NULL, "frequency" varchar NOT NULL, "day" integer, "date" date, "day_rule" varchar, "custom_interval_unit" varchar, "account" varchar, "funding_account" varchar, "category" varchar, "non_rollover" boolean NOT NULL DEFAULT (0), "last_payment_date" date, "last_payment_amount" real, "planId" varchar, CONSTRAINT "FK_b3cc995a62843e0ff7f525e623c" FOREIGN KEY ("planId") REFERENCES "financial_plans" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_recurring_expenses"("id", "concept", "amount", "frequency", "day", "date", "day_rule", "custom_interval_unit", "account", "funding_account", "category", "non_rollover", "last_payment_date", "last_payment_amount", "planId") SELECT "id", "concept", "amount", "frequency", "day", "date", "day_rule", "custom_interval_unit", "account", "funding_account", "category", "non_rollover", "last_payment_date", "last_payment_amount", "planId" FROM "recurring_expenses"`,
    );
    await queryRunner.query(`DROP TABLE "recurring_expenses"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_recurring_expenses" RENAME TO "recurring_expenses"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_recurring_expense_days" ("id" varchar PRIMARY KEY NOT NULL, "day" integer NOT NULL, "recurringExpenseId" varchar, CONSTRAINT "FK_1ad1a5f0bf26768fa6d8e68b295" FOREIGN KEY ("recurringExpenseId") REFERENCES "recurring_expenses" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_recurring_expense_days"("id", "day", "recurringExpenseId") SELECT "id", "day", "recurringExpenseId" FROM "recurring_expense_days"`,
    );
    await queryRunner.query(`DROP TABLE "recurring_expense_days"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_recurring_expense_days" RENAME TO "recurring_expense_days"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_completed_items" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "date" date NOT NULL, "concept" varchar NOT NULL, "amount" real NOT NULL, "type" varchar, "category" varchar, "from_account" varchar, "to_account" varchar, "account" varchar, "status" varchar NOT NULL DEFAULT ('completed'), "planId" varchar, CONSTRAINT "UQ_59df08c7c4321d7cd376fff0d90" UNIQUE ("planId", "external_id"), CONSTRAINT "FK_a2cf428381c76ec174313eddae4" FOREIGN KEY ("planId") REFERENCES "financial_plans" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_completed_items"("id", "external_id", "date", "concept", "amount", "type", "category", "from_account", "to_account", "account", "status", "planId") SELECT "id", "external_id", "date", "concept", "amount", "type", "category", "from_account", "to_account", "account", "status", "planId" FROM "completed_items"`,
    );
    await queryRunner.query(`DROP TABLE "completed_items"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_completed_items" RENAME TO "completed_items"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_pre_income_allocations" ("id" varchar PRIMARY KEY NOT NULL, "available_amount" real NOT NULL, "period_end" date NOT NULL, "plan_id" varchar, CONSTRAINT "REL_9c23caab35c9f3038209811468" UNIQUE ("plan_id"), CONSTRAINT "FK_9c23caab35c9f3038209811468c" FOREIGN KEY ("plan_id") REFERENCES "financial_plans" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_pre_income_allocations"("id", "available_amount", "period_end", "plan_id") SELECT "id", "available_amount", "period_end", "plan_id" FROM "pre_income_allocations"`,
    );
    await queryRunner.query(`DROP TABLE "pre_income_allocations"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_pre_income_allocations" RENAME TO "pre_income_allocations"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_pre_income_allocation_items" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "date" date NOT NULL, "concept" varchar NOT NULL, "amount" real NOT NULL, "category" varchar, "account" varchar, "status" varchar NOT NULL DEFAULT ('pending'), "non_rollover" boolean NOT NULL DEFAULT (0), "preIncomeAllocationId" varchar, CONSTRAINT "FK_5e9f689e3435ed993bb1b628a7d" FOREIGN KEY ("preIncomeAllocationId") REFERENCES "pre_income_allocations" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_pre_income_allocation_items"("id", "external_id", "date", "concept", "amount", "category", "account", "status", "non_rollover", "preIncomeAllocationId") SELECT "id", "external_id", "date", "concept", "amount", "category", "account", "status", "non_rollover", "preIncomeAllocationId" FROM "pre_income_allocation_items"`,
    );
    await queryRunner.query(`DROP TABLE "pre_income_allocation_items"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_pre_income_allocation_items" RENAME TO "pre_income_allocation_items"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_current_account_balances" ("id" varchar PRIMARY KEY NOT NULL, "as_of" date NOT NULL, "account_name" varchar NOT NULL, "amount" real NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "planId" varchar, CONSTRAINT "FK_2bc08d49ebc93d8a793c0de3580" FOREIGN KEY ("planId") REFERENCES "financial_plans" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_current_account_balances"("id", "as_of", "account_name", "amount", "currency", "planId") SELECT "id", "as_of", "account_name", "amount", "currency", "planId" FROM "current_account_balances"`,
    );
    await queryRunner.query(`DROP TABLE "current_account_balances"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_current_account_balances" RENAME TO "current_account_balances"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_current_debt_balances" ("id" varchar PRIMARY KEY NOT NULL, "as_of" date NOT NULL, "debt_name" varchar NOT NULL, "amount" real NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "planId" varchar, CONSTRAINT "FK_cf0c3209d36260edc5bc2b736c5" FOREIGN KEY ("planId") REFERENCES "financial_plans" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_current_debt_balances"("id", "as_of", "debt_name", "amount", "currency", "planId") SELECT "id", "as_of", "debt_name", "amount", "currency", "planId" FROM "current_debt_balances"`,
    );
    await queryRunner.query(`DROP TABLE "current_debt_balances"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_current_debt_balances" RENAME TO "current_debt_balances"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_debt_projection_snapshots" ("id" varchar PRIMARY KEY NOT NULL, "date" date NOT NULL, "planId" varchar, CONSTRAINT "FK_c9fce7a82e63be9c01f0778a127" FOREIGN KEY ("planId") REFERENCES "financial_plans" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_debt_projection_snapshots"("id", "date", "planId") SELECT "id", "date", "planId" FROM "debt_projection_snapshots"`,
    );
    await queryRunner.query(`DROP TABLE "debt_projection_snapshots"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_debt_projection_snapshots" RENAME TO "debt_projection_snapshots"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_debt_projection_balances" ("id" varchar PRIMARY KEY NOT NULL, "account_name" varchar NOT NULL, "amount" real NOT NULL, "snapshotId" varchar, CONSTRAINT "FK_cfcc12c3bc370cb922881f9ed9d" FOREIGN KEY ("snapshotId") REFERENCES "debt_projection_snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_debt_projection_balances"("id", "account_name", "amount", "snapshotId") SELECT "id", "account_name", "amount", "snapshotId" FROM "debt_projection_balances"`,
    );
    await queryRunner.query(`DROP TABLE "debt_projection_balances"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_debt_projection_balances" RENAME TO "debt_projection_balances"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_plan_rules" ("id" varchar PRIMARY KEY NOT NULL, "key" varchar NOT NULL, "value_json" text NOT NULL, "planId" varchar, CONSTRAINT "UQ_eeca99a747afcec015302471a7f" UNIQUE ("planId", "key"), CONSTRAINT "FK_6c24d214c04fffd08ea41b1fd4e" FOREIGN KEY ("planId") REFERENCES "financial_plans" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_plan_rules"("id", "key", "value_json", "planId") SELECT "id", "key", "value_json", "planId" FROM "plan_rules"`,
    );
    await queryRunner.query(`DROP TABLE "plan_rules"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_plan_rules" RENAME TO "plan_rules"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_summary_notes" ("id" varchar PRIMARY KEY NOT NULL, "note" text NOT NULL, "planId" varchar, CONSTRAINT "FK_ea316f89c3504027e360c0abbf8" FOREIGN KEY ("planId") REFERENCES "financial_plans" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_summary_notes"("id", "note", "planId") SELECT "id", "note", "planId" FROM "summary_notes"`,
    );
    await queryRunner.query(`DROP TABLE "summary_notes"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_summary_notes" RENAME TO "summary_notes"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "summary_notes" RENAME TO "temporary_summary_notes"`,
    );
    await queryRunner.query(
      `CREATE TABLE "summary_notes" ("id" varchar PRIMARY KEY NOT NULL, "note" text NOT NULL, "planId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "summary_notes"("id", "note", "planId") SELECT "id", "note", "planId" FROM "temporary_summary_notes"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_summary_notes"`);
    await queryRunner.query(
      `ALTER TABLE "plan_rules" RENAME TO "temporary_plan_rules"`,
    );
    await queryRunner.query(
      `CREATE TABLE "plan_rules" ("id" varchar PRIMARY KEY NOT NULL, "key" varchar NOT NULL, "value_json" text NOT NULL, "planId" varchar, CONSTRAINT "UQ_eeca99a747afcec015302471a7f" UNIQUE ("planId", "key"))`,
    );
    await queryRunner.query(
      `INSERT INTO "plan_rules"("id", "key", "value_json", "planId") SELECT "id", "key", "value_json", "planId" FROM "temporary_plan_rules"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_plan_rules"`);
    await queryRunner.query(
      `ALTER TABLE "debt_projection_balances" RENAME TO "temporary_debt_projection_balances"`,
    );
    await queryRunner.query(
      `CREATE TABLE "debt_projection_balances" ("id" varchar PRIMARY KEY NOT NULL, "account_name" varchar NOT NULL, "amount" real NOT NULL, "snapshotId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "debt_projection_balances"("id", "account_name", "amount", "snapshotId") SELECT "id", "account_name", "amount", "snapshotId" FROM "temporary_debt_projection_balances"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_debt_projection_balances"`);
    await queryRunner.query(
      `ALTER TABLE "debt_projection_snapshots" RENAME TO "temporary_debt_projection_snapshots"`,
    );
    await queryRunner.query(
      `CREATE TABLE "debt_projection_snapshots" ("id" varchar PRIMARY KEY NOT NULL, "date" date NOT NULL, "planId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "debt_projection_snapshots"("id", "date", "planId") SELECT "id", "date", "planId" FROM "temporary_debt_projection_snapshots"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_debt_projection_snapshots"`);
    await queryRunner.query(
      `ALTER TABLE "current_debt_balances" RENAME TO "temporary_current_debt_balances"`,
    );
    await queryRunner.query(
      `CREATE TABLE "current_debt_balances" ("id" varchar PRIMARY KEY NOT NULL, "as_of" date NOT NULL, "debt_name" varchar NOT NULL, "amount" real NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "planId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "current_debt_balances"("id", "as_of", "debt_name", "amount", "currency", "planId") SELECT "id", "as_of", "debt_name", "amount", "currency", "planId" FROM "temporary_current_debt_balances"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_current_debt_balances"`);
    await queryRunner.query(
      `ALTER TABLE "current_account_balances" RENAME TO "temporary_current_account_balances"`,
    );
    await queryRunner.query(
      `CREATE TABLE "current_account_balances" ("id" varchar PRIMARY KEY NOT NULL, "as_of" date NOT NULL, "account_name" varchar NOT NULL, "amount" real NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "planId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "current_account_balances"("id", "as_of", "account_name", "amount", "currency", "planId") SELECT "id", "as_of", "account_name", "amount", "currency", "planId" FROM "temporary_current_account_balances"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_current_account_balances"`);
    await queryRunner.query(
      `ALTER TABLE "pre_income_allocation_items" RENAME TO "temporary_pre_income_allocation_items"`,
    );
    await queryRunner.query(
      `CREATE TABLE "pre_income_allocation_items" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "date" date NOT NULL, "concept" varchar NOT NULL, "amount" real NOT NULL, "category" varchar, "account" varchar, "status" varchar NOT NULL DEFAULT ('pending'), "non_rollover" boolean NOT NULL DEFAULT (0), "preIncomeAllocationId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "pre_income_allocation_items"("id", "external_id", "date", "concept", "amount", "category", "account", "status", "non_rollover", "preIncomeAllocationId") SELECT "id", "external_id", "date", "concept", "amount", "category", "account", "status", "non_rollover", "preIncomeAllocationId" FROM "temporary_pre_income_allocation_items"`,
    );
    await queryRunner.query(
      `DROP TABLE "temporary_pre_income_allocation_items"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pre_income_allocations" RENAME TO "temporary_pre_income_allocations"`,
    );
    await queryRunner.query(
      `CREATE TABLE "pre_income_allocations" ("id" varchar PRIMARY KEY NOT NULL, "available_amount" real NOT NULL, "period_end" date NOT NULL, "plan_id" varchar, CONSTRAINT "REL_9c23caab35c9f3038209811468" UNIQUE ("plan_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "pre_income_allocations"("id", "available_amount", "period_end", "plan_id") SELECT "id", "available_amount", "period_end", "plan_id" FROM "temporary_pre_income_allocations"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_pre_income_allocations"`);
    await queryRunner.query(
      `ALTER TABLE "completed_items" RENAME TO "temporary_completed_items"`,
    );
    await queryRunner.query(
      `CREATE TABLE "completed_items" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "date" date NOT NULL, "concept" varchar NOT NULL, "amount" real NOT NULL, "type" varchar, "category" varchar, "from_account" varchar, "to_account" varchar, "account" varchar, "status" varchar NOT NULL DEFAULT ('completed'), "planId" varchar, CONSTRAINT "UQ_59df08c7c4321d7cd376fff0d90" UNIQUE ("planId", "external_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "completed_items"("id", "external_id", "date", "concept", "amount", "type", "category", "from_account", "to_account", "account", "status", "planId") SELECT "id", "external_id", "date", "concept", "amount", "type", "category", "from_account", "to_account", "account", "status", "planId" FROM "temporary_completed_items"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_completed_items"`);
    await queryRunner.query(
      `ALTER TABLE "recurring_expense_days" RENAME TO "temporary_recurring_expense_days"`,
    );
    await queryRunner.query(
      `CREATE TABLE "recurring_expense_days" ("id" varchar PRIMARY KEY NOT NULL, "day" integer NOT NULL, "recurringExpenseId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "recurring_expense_days"("id", "day", "recurringExpenseId") SELECT "id", "day", "recurringExpenseId" FROM "temporary_recurring_expense_days"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_recurring_expense_days"`);
    await queryRunner.query(
      `ALTER TABLE "recurring_expenses" RENAME TO "temporary_recurring_expenses"`,
    );
    await queryRunner.query(
      `CREATE TABLE "recurring_expenses" ("id" varchar PRIMARY KEY NOT NULL, "concept" varchar NOT NULL, "amount" real NOT NULL, "frequency" varchar NOT NULL, "day" integer, "date" date, "day_rule" varchar, "account" varchar, "funding_account" varchar, "category" varchar, "non_rollover" boolean NOT NULL DEFAULT (0), "last_payment_date" date, "last_payment_amount" real, "planId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "recurring_expenses"("id", "concept", "amount", "frequency", "day", "date", "day_rule", "account", "funding_account", "category", "non_rollover", "last_payment_date", "last_payment_amount", "planId") SELECT "id", "concept", "amount", "frequency", "day", "date", "day_rule", "account", "funding_account", "category", "non_rollover", "last_payment_date", "last_payment_amount", "planId" FROM "temporary_recurring_expenses"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_recurring_expenses"`);
    await queryRunner.query(
      `ALTER TABLE "payment_period_items" RENAME TO "temporary_payment_period_items"`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_period_items" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "date" date NOT NULL, "concept" varchar NOT NULL, "planned_amount" real NOT NULL, "actual_amount" real, "category" varchar, "account" varchar, "funding_account" varchar, "status" varchar NOT NULL DEFAULT ('pending'), "completed_at" datetime, "notes" text, "non_rollover" boolean NOT NULL DEFAULT (0), "treated_as_spent_if_unused" boolean NOT NULL DEFAULT (0), "paymentPeriodId" varchar, CONSTRAINT "UQ_be54640c7e55702f119c25fe8ef" UNIQUE ("paymentPeriodId", "external_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "payment_period_items"("id", "external_id", "date", "concept", "planned_amount", "actual_amount", "category", "account", "funding_account", "status", "completed_at", "notes", "non_rollover", "treated_as_spent_if_unused", "paymentPeriodId") SELECT "id", "external_id", "date", "concept", "planned_amount", "actual_amount", "category", "account", "funding_account", "status", "completed_at", "notes", "non_rollover", "treated_as_spent_if_unused", "paymentPeriodId" FROM "temporary_payment_period_items"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_payment_period_items"`);
    await queryRunner.query(
      `ALTER TABLE "payment_periods" RENAME TO "temporary_payment_periods"`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_periods" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "income_date" date NOT NULL, "planned_total" real NOT NULL DEFAULT (0), "planned_remaining" real NOT NULL DEFAULT (0), "planId" varchar, "income_payment_id" varchar, CONSTRAINT "UQ_d3be129c1d6952edaad3b6a36ee" UNIQUE ("planId", "external_id"), CONSTRAINT "REL_9b43d995342520f51f2ee0fe7d" UNIQUE ("income_payment_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "payment_periods"("id", "external_id", "income_date", "planned_total", "planned_remaining", "planId", "income_payment_id") SELECT "id", "external_id", "income_date", "planned_total", "planned_remaining", "planId", "income_payment_id" FROM "temporary_payment_periods"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_payment_periods"`);
    await queryRunner.query(
      `ALTER TABLE "income_payments" RENAME TO "temporary_income_payments"`,
    );
    await queryRunner.query(
      `CREATE TABLE "income_payments" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar, "date" date NOT NULL, "month" varchar NOT NULL, "payment_number_in_month" integer NOT NULL, "amount" real NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "status" varchar NOT NULL DEFAULT ('projected'), "source" varchar NOT NULL DEFAULT ('manual'), "planId" varchar, "incomeScheduleId" varchar, CONSTRAINT "UQ_03282b20c1e31a88f87548f166d" UNIQUE ("planId", "external_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "income_payments"("id", "external_id", "date", "month", "payment_number_in_month", "amount", "currency", "status", "source", "planId", "incomeScheduleId") SELECT "id", "external_id", "date", "month", "payment_number_in_month", "amount", "currency", "status", "source", "planId", "incomeScheduleId" FROM "temporary_income_payments"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_income_payments"`);
    await queryRunner.query(
      `ALTER TABLE "income_schedule_amount_rules" RENAME TO "temporary_income_schedule_amount_rules"`,
    );
    await queryRunner.query(
      `CREATE TABLE "income_schedule_amount_rules" ("id" varchar PRIMARY KEY NOT NULL, "payment_number_in_month" integer NOT NULL, "amount" real NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "incomeScheduleId" varchar, CONSTRAINT "UQ_1b0477e8bb636ffd3ba48cf841e" UNIQUE ("incomeScheduleId", "payment_number_in_month"))`,
    );
    await queryRunner.query(
      `INSERT INTO "income_schedule_amount_rules"("id", "payment_number_in_month", "amount", "currency", "incomeScheduleId") SELECT "id", "payment_number_in_month", "amount", "currency", "incomeScheduleId" FROM "temporary_income_schedule_amount_rules"`,
    );
    await queryRunner.query(
      `DROP TABLE "temporary_income_schedule_amount_rules"`,
    );
    await queryRunner.query(
      `ALTER TABLE "income_schedules" RENAME TO "temporary_income_schedules"`,
    );
    await queryRunner.query(
      `CREATE TABLE "income_schedules" ("id" varchar PRIMARY KEY NOT NULL, "cadence" varchar NOT NULL, "anchor_payment_date" date NOT NULL, "currency" varchar NOT NULL DEFAULT ('MXN'), "ordinary_month_gross_income" real, "ordinary_month_net_reference" real, "generated_through" date, "generation_method" varchar, "calculation_rule" text, "plan_id" varchar, CONSTRAINT "REL_b408b2489357e3ac79a59ce816" UNIQUE ("plan_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "income_schedules"("id", "cadence", "anchor_payment_date", "currency", "ordinary_month_gross_income", "ordinary_month_net_reference", "generated_through", "generation_method", "calculation_rule", "plan_id") SELECT "id", "cadence", "anchor_payment_date", "currency", "ordinary_month_gross_income", "ordinary_month_net_reference", "generated_through", "generation_method", "calculation_rule", "plan_id" FROM "temporary_income_schedules"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_income_schedules"`);
    await queryRunner.query(
      `ALTER TABLE "accounts" RENAME TO "temporary_accounts"`,
    );
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" varchar PRIMARY KEY NOT NULL, "external_id" varchar NOT NULL, "name" varchar NOT NULL, "type" varchar NOT NULL, "planId" varchar, CONSTRAINT "UQ_8c3ae1b8938ad67b924a6ca7b05" UNIQUE ("planId", "external_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "accounts"("id", "external_id", "name", "type", "planId") SELECT "id", "external_id", "name", "type", "planId" FROM "temporary_accounts"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_accounts"`);
    await queryRunner.query(
      `ALTER TABLE "allocation_categories" RENAME TO "temporary_allocation_categories"`,
    );
    await queryRunner.query(
      `CREATE TABLE "allocation_categories" ("id" varchar PRIMARY KEY NOT NULL, "key" varchar NOT NULL, "name" varchar NOT NULL, "percentage" real NOT NULL, "description" text, "planId" varchar, CONSTRAINT "UQ_4ee3934ef0d1de5dc0b47bb4efc" UNIQUE ("planId", "key"))`,
    );
    await queryRunner.query(
      `INSERT INTO "allocation_categories"("id", "key", "name", "percentage", "description", "planId") SELECT "id", "key", "name", "percentage", "description", "planId" FROM "temporary_allocation_categories"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_allocation_categories"`);
    await queryRunner.query(`DROP TABLE "summary_notes"`);
    await queryRunner.query(`DROP TABLE "plan_rules"`);
    await queryRunner.query(`DROP TABLE "debt_projection_balances"`);
    await queryRunner.query(`DROP TABLE "debt_projection_snapshots"`);
    await queryRunner.query(`DROP TABLE "current_debt_balances"`);
    await queryRunner.query(`DROP TABLE "current_account_balances"`);
    await queryRunner.query(`DROP TABLE "pre_income_allocation_items"`);
    await queryRunner.query(`DROP TABLE "pre_income_allocations"`);
    await queryRunner.query(`DROP TABLE "completed_items"`);
    await queryRunner.query(`DROP TABLE "recurring_expense_days"`);
    await queryRunner.query(`DROP TABLE "recurring_expenses"`);
    await queryRunner.query(`DROP TABLE "payment_period_items"`);
    await queryRunner.query(`DROP TABLE "payment_periods"`);
    await queryRunner.query(`DROP TABLE "income_payments"`);
    await queryRunner.query(`DROP TABLE "income_schedule_amount_rules"`);
    await queryRunner.query(`DROP TABLE "income_schedules"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TABLE "allocation_categories"`);
    await queryRunner.query(`DROP TABLE "financial_plans"`);
  }
}
