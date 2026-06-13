import {
  applyDecorators,
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { Response } from 'express';

export class ApiErrorDetailDto {
  @ApiProperty()
  field: string;

  @ApiProperty({ type: [String] })
  messages: string[];
}

export class ApiErrorBodyDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  message: string;

  @ApiProperty({
    type: [ApiErrorDetailDto],
    nullable: true,
    required: false,
  })
  details?: ApiErrorDetailDto[] | null;
}

export class ApiErrorResponseDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty({ type: ApiErrorBodyDto })
  error: ApiErrorBodyDto;

  @ApiProperty()
  path: string;

  @ApiProperty({ format: 'date-time' })
  timestamp: string;
}

export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: flattenValidationErrors(errors),
      }),
  });
}

@Catch()
export class StructuredHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<{ url: string }>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const error = formatErrorBody(exception, status);

    response.status(status).json({
      statusCode: status,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

export function ApiDefaultErrorResponses() {
  return applyDecorators(
    ApiBadRequestResponse({ type: ApiErrorResponseDto }),
    ApiNotFoundResponse({ type: ApiErrorResponseDto }),
    ApiInternalServerErrorResponse({ type: ApiErrorResponseDto }),
  );
}

function formatErrorBody(exception: unknown, status: number) {
  if (!(exception instanceof HttpException)) {
    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      details: null,
    };
  }

  const response = exception.getResponse();
  if (typeof response === 'string') {
    return {
      code: codeFromStatus(status),
      message: response,
      details: null,
    };
  }

  if (isErrorResponse(response)) {
    return {
      code: response.code,
      message: response.message,
      details: response.details ?? null,
    };
  }

  const errorResponse = isMessageResponse(response) ? response : null;

  const message =
    typeof errorResponse?.message === 'string'
      ? errorResponse.message
      : Array.isArray(errorResponse?.message)
        ? errorResponse.message.join(', ')
        : exception.message;

  return {
    code: codeFromStatus(status),
    message,
    details: null,
  };
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath?: string,
): ApiErrorDetailDto[] {
  return errors.flatMap((error) => {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const own = error.constraints
      ? [{ field: path, messages: Object.values(error.constraints) }]
      : [];
    const nested = error.children?.length
      ? flattenValidationErrors(error.children, path)
      : [];
    return [...own, ...nested];
  });
}

function codeFromStatus(status: number) {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'BAD_REQUEST';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

function isErrorResponse(response: unknown): response is {
  code: string;
  message: string;
  details?: ApiErrorDetailDto[];
} {
  return (
    typeof response === 'object' &&
    response !== null &&
    'code' in response &&
    'message' in response
  );
}

function isMessageResponse(
  response: unknown,
): response is { message?: string | string[] } {
  return (
    typeof response === 'object' && response !== null && 'message' in response
  );
}
