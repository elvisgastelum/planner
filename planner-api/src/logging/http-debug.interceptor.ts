import { randomUUID } from 'node:crypto';

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, Subscription, tap } from 'rxjs';

import { isDebugLoggingEnabled } from './debug-config';
import { summarizeValue } from './debug-summarizer';
import { PlannerLogger } from './planner-logger.service';
import { runWithRequestContext } from './request-context';

@Injectable()
export class HttpDebugInterceptor implements NestInterceptor {
  constructor(private readonly logger: PlannerLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!isDebugLoggingEnabled()) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const requestId =
      (request.headers['x-correlation-id'] as string | undefined) ??
      randomUUID();

    response.setHeader('X-Correlation-Id', requestId);

    const requestContext = {
      requestId,
      method: request.method,
      path: request.originalUrl ?? request.url,
    };

    return new Observable((subscriber) => {
      let innerSubscription: Subscription | undefined;

      runWithRequestContext(requestContext, () => {
        const startedAt = Date.now();

        this.logger.debugTrace('HTTP IN', {
          requestId,
          method: request.method,
          path: request.originalUrl ?? request.url,
          params: summarizeValue(request.params),
          query: summarizeValue(request.query),
          body: summarizeValue(request.body),
        });

        innerSubscription = next
          .handle()
          .pipe(
            tap({
              next: (value) => {
                this.logger.debugTrace('HTTP OUT', {
                  requestId,
                  method: request.method,
                  path: request.originalUrl ?? request.url,
                  statusCode: response.statusCode,
                  durationMs: Date.now() - startedAt,
                  response: summarizeValue(value),
                });
              },
              error: (error) => {
                this.logger.errorTrace('HTTP ERROR', {
                  requestId,
                  method: request.method,
                  path: request.originalUrl ?? request.url,
                  durationMs: Date.now() - startedAt,
                  error: summarizeValue(error),
                });
              },
            }),
          )
          .subscribe(subscriber);
      });

      return () => innerSubscription?.unsubscribe();
    });
  }
}
