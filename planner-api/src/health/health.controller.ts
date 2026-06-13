import { Controller, Get, Version } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller({ path: '', version: '1' })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @Version('1')
  @HealthCheck()
  @ApiOkResponse({
    description: 'Health check result',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error', 'shutting_down'] },
        info: {
          type: 'object',
          nullable: true,
          additionalProperties: {
            type: 'object',
            properties: { status: { type: 'string' } },
          },
        },
        error: {
          type: 'object',
          nullable: true,
          additionalProperties: {
            type: 'object',
            properties: { status: { type: 'string' } },
          },
        },
        details: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: { status: { type: 'string' } },
          },
        },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Health check failed',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['error'] },
        info: {
          type: 'object',
          nullable: true,
          additionalProperties: {
            type: 'object',
            properties: { status: { type: 'string' } },
          },
        },
        error: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: { status: { type: 'string' } },
          },
        },
        details: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: { status: { type: 'string' } },
          },
        },
      },
    },
  })
  check() {
    return this.health.check([() => this.database.pingCheck('database')]);
  }
}
