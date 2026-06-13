import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { plannerEntities } from './entities';
import { PlannerController } from './planner.controller';
import { commandHandlers, queryHandlers } from './planner.cqrs';
import { PlannerService } from './planner.service';

@Module({
  imports: [TypeOrmModule.forFeature(plannerEntities)],
  controllers: [PlannerController],
  providers: [PlannerService, ...commandHandlers, ...queryHandlers],
})
export class PlannerModule {}
