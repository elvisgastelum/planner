import 'reflect-metadata';

import { existsSync, unlinkSync } from 'node:fs';

import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { AppModule } from '../app.module';
import { getNestLoggerLevels } from '../logging/debug-config';
import { PlannerLogger } from '../logging/planner-logger.service';
import { seedPlanFinanciero } from './plan-financiero.seed';

async function main() {
  // Create temporary app to get database path
  const tempApp = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const tempDataSource = tempApp.get(DataSource);
  const dbOptions = tempDataSource.options as { database?: string };
  const dbPath = dbOptions.database;
  await tempApp.close();

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: getNestLoggerLevels(),
  });

  app.useLogger(app.get(PlannerLogger));
  const logger = app.get(PlannerLogger);

  try {
    // Delete existing database file and journal files
    if (dbPath) {
      const filesToDelete = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];
      for (const file of filesToDelete) {
        if (existsSync(file)) {
          logger.log(`Deleting: ${file}`);
          unlinkSync(file);
        }
      }
      logger.log('Database files deleted');
    } else {
      logger.log('No database path configured, skipping file deletion');
    }

    // Close and recreate app to initialize fresh database
    await app.close();

    const newApp = await NestFactory.createApplicationContext(AppModule, {
      logger: getNestLoggerLevels(),
    });
    newApp.useLogger(newApp.get(PlannerLogger));
    const newLogger = newApp.get(PlannerLogger);
    const newDataSource = newApp.get(DataSource);

    // Run migrations if available
    try {
      await newDataSource.runMigrations();
      newLogger.log('Migrations completed');
    } catch {
      newLogger.log('No migrations to run or migrations skipped');
    }

    // Seed database
    newLogger.log('Seeding database...');
    const queryRunner = newDataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const plan = await seedPlanFinanciero(queryRunner);

      await queryRunner.commitTransaction();
      newLogger.log(`Seeded plan ${plan.metadataId}`);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
      await newApp.close();
    }
  } catch (error) {
    logger.error('Reset failed', error);
    try {
      await app.close();
    } catch {
      // Ignore close errors
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
