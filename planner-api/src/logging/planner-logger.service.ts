import { ConsoleLogger, Injectable } from '@nestjs/common';

import { isDebugLoggingEnabled } from './debug-config';
import { formatDebugMessage, summarizeValue } from './debug-summarizer';
import { getRequestContext } from './request-context';

@Injectable()
export class PlannerLogger extends ConsoleLogger {
  private readonly debugEnabled = isDebugLoggingEnabled();

  constructor() {
    super('PlannerAPI');
  }

  debugTrace(label: string, payload?: unknown) {
    if (!this.debugEnabled) return;
    super.debug(this.withRequestContext(formatDebugMessage(label, payload)));
  }

  infoTrace(label: string, payload?: unknown) {
    super.log(this.withRequestContext(formatDebugMessage(label, payload)));
  }

  warnTrace(label: string, payload?: unknown) {
    super.warn(this.withRequestContext(formatDebugMessage(label, payload)));
  }

  errorTrace(label: string, payload?: unknown) {
    super.error(this.withRequestContext(formatDebugMessage(label, payload)));
  }

  summarize(payload: unknown) {
    return summarizeValue(payload);
  }

  private withRequestContext(message: string) {
    const requestContext = getRequestContext();

    if (!requestContext) return message;

    return `[${requestContext.requestId}] ${message}`;
  }
}
