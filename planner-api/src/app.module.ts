import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthModule } from './health/health.module';
import { isDebugLoggingEnabled } from './logging/debug-config';
import { LoggingModule } from './logging/logging.module';
import { PlannerModule } from './planner/planner.module';
import { resolveDatabasePath } from './database/env';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggingModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'sqlite',
        database: resolveDatabasePath(),
        autoLoadEntities: true,
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        migrationsRun: false,
        migrationsTableName: 'migrations',
        migrationsTransactionMode: 'all',
        synchronize: false,
        logging: isDebugLoggingEnabled()
          ? ['query', 'error', 'warn', 'migration']
          : ['error', 'warn'],
        logger: isDebugLoggingEnabled() ? 'advanced-console' : 'simple-console',
        maxQueryExecutionTime: isDebugLoggingEnabled() ? 250 : 1000,
        retryAttempts: 1,
      }),
    }),
    CqrsModule.forRoot(),
    HealthModule,
    PlannerModule,
    RouterModule.register([
      { path: 'health', module: HealthModule },
      { path: 'plans', module: PlannerModule },
    ]),
  ],
})
export class AppModule {}
