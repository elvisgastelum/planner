import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthModule } from './health/health.module';
import { PlannerModule } from './planner/planner.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'sqlite',
        database: process.env.DATABASE_PATH ?? 'planner.sqlite',
        autoLoadEntities: true,
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
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
