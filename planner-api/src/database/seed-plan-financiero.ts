import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { AppModule } from '../app.module';
import { getNestLoggerLevels } from '../logging/debug-config';
import { PlannerLogger } from '../logging/planner-logger.service';
import { seedPlanFinanciero } from './plan-financiero.seed';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: getNestLoggerLevels(),
  });

  app.useLogger(app.get(PlannerLogger));

  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const plan = await seedPlanFinanciero(queryRunner);

    await queryRunner.commitTransaction();
    app.get(PlannerLogger).log(`Seeded plan ${plan.metadataId}`);
  } catch (error) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    throw error;
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
