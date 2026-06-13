import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { HttpDebugInterceptor } from './http-debug.interceptor';
import { PlannerLogger } from './planner-logger.service';

@Global()
@Module({
  providers: [
    PlannerLogger,
    HttpDebugInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: HttpDebugInterceptor,
    },
  ],
  exports: [PlannerLogger],
})
export class LoggingModule {}
