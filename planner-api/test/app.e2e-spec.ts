import { INestApplication, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

import { AppModule } from './../src/app.module';
import {
  createValidationPipe,
  StructuredHttpExceptionFilter,
} from './../src/http';
import { plannerEntities } from './../src/planner/entities';

describe('Planner API (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(createValidationPipe());
    app.useGlobalFilters(new StructuredHttpExceptionFilter());

    const config = new DocumentBuilder()
      .setTitle('Financial Planner API')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/docs', app, document);

    await app.init();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await clearDatabase(dataSource);
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
      });
  });

  it('/api/v1/docs (GET)', () => {
    return request(app.getHttpServer()).get('/api/v1/docs').expect(200);
  });

  it('/api/v1/docs-json includes planner response schemas', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/docs-json')
      .expect(200);

    const document = response.body;
    const getResponseSchema = (path: string, method: string, status: string) =>
      document.paths[path][method].responses[status].content['application/json']
        .schema;

    expect(getResponseSchema('/api/v1/plans', 'get', '200')).toEqual({
      items: { $ref: '#/components/schemas/FinancialPlanResponseDto' },
      type: 'array',
    });
    expect(getResponseSchema('/api/v1/plans/{planId}', 'get', '200')).toEqual({
      $ref: '#/components/schemas/FinancialPlanDetailResponseDto',
    });
    expect(
      getResponseSchema('/api/v1/plans/{planId}/accounts', 'get', '200'),
    ).toEqual({
      items: { $ref: '#/components/schemas/AccountResponseDto' },
      type: 'array',
    });
    expect(
      getResponseSchema('/api/v1/plans/{planId}', 'delete', '200'),
    ).toEqual({
      $ref: '#/components/schemas/DeleteResultDto',
    });
    expect(
      getResponseSchema(
        '/api/v1/plans/{planId}/income-schedule',
        'delete',
        '200',
      ),
    ).toEqual({
      $ref: '#/components/schemas/DeleteResultDto',
    });
    expect(
      document.components.schemas.FinancialPlanDetailResponseDto.properties
        .paymentPeriods.items.$ref,
    ).toBe('#/components/schemas/PaymentPeriodResponseDto');
    expect(
      document.components.schemas.CreateIncomeScheduleDto.properties.cadence
        .enum,
    ).toEqual(['every_14_days']);
    expect(
      document.components.schemas.RecurringExpenseResponseDto.properties.dayRule
        .enum,
    ).toEqual(['last_friday']);
    expect(
      document.components.schemas.ApiErrorResponseDto.properties.error.$ref,
    ).toBe('#/components/schemas/ApiErrorBodyDto');
  });

  it('/api/v1/plans (POST, GET)', async () => {
    const metadataId = `plan-test-${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/plans')
      .send({
        metadataId,
        name: 'Test financial plan',
        currency: 'MXN',
        startDate: '2026-06-11',
        endDate: '2026-08-14',
        status: 'active',
      })
      .expect(201);

    expect(createResponse.body.id).toBeDefined();
    expect(createResponse.body.metadataId).toBe(metadataId);

    await request(app.getHttpServer())
      .get('/api/v1/plans')
      .expect(200)
      .expect(({ body }) => {
        expect(
          body.some(
            (plan: { metadataId: string }) => plan.metadataId === metadataId,
          ),
        ).toBe(true);
      });
  });

  it('/api/v1/plans/import-json (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/plans/import-json')
      .send({})
      .expect(201)
      .expect(({ body }) => {
        expect(body.metadataId).toBe(
          'plan-financiero-final-2026-06-11-2026-08-14',
        );
        expect(body.imported).toBe(true);
        expect(body.counts.amountRules).toBe(3);
        expect(body.counts.paymentPeriods).toBeGreaterThan(0);
      });
  });

  it('/api/v1/plans/:planId/income-schedule (DELETE)', async () => {
    const metadataId = `schedule-delete-${Date.now()}`;
    const createPlanResponse = await request(app.getHttpServer())
      .post('/api/v1/plans')
      .send({
        metadataId,
        name: 'Income schedule plan',
        currency: 'MXN',
        startDate: '2026-06-11',
        status: 'active',
      })
      .expect(201);

    const planId = createPlanResponse.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/income-schedule`)
      .send({
        cadence: 'every_14_days',
        anchorPaymentDate: '2026-06-19',
        amountRules: [{ paymentNumberInMonth: 1, amount: 25000 }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/v1/plans/${planId}/income-schedule`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ deleted: true });
      });

    await request(app.getHttpServer())
      .get(`/api/v1/plans/${planId}/income-schedule`)
      .expect(404)
      .expect(({ body }) => {
        expect(body.error).toEqual({
          code: 'NOT_FOUND',
          message: `Plan ${planId} has no income schedule`,
          details: null,
        });
      });
  });

  it.skip('returns stable account and category IDs in derived response fields', async () => {
    const importResponse = await request(app.getHttpServer())
      .post('/api/v1/plans/import-json')
      .send({})
      .expect(201);

    const planId = importResponse.body.id;
    const planResponse = await request(app.getHttpServer())
      .get(`/api/v1/plans/${planId}`)
      .expect(200);

    const recurringExpense = planResponse.body.recurringExpenses.find(
      (expense: { account: string; category: string }) =>
        expense.account === 'BBVA Debit' &&
        expense.category === 'gastos_basicos',
    );
    const item = planResponse.body.paymentPeriods
      .flatMap((period: { items: unknown[] }) => period.items)
      .find(
        (periodItem: { account: string; category: string }) =>
          periodItem.account === 'BBVA Debit' &&
          periodItem.category === 'gastos_basicos',
      );
    const account = planResponse.body.accounts.find(
      (entry: { name: string }) => entry.name === 'BBVA Debit',
    );
    const category = planResponse.body.allocationCategories.find(
      (entry: { key: string }) => entry.key === 'gastos_basicos',
    );

    expect(recurringExpense.accountId).toBe(account.id);
    expect(recurringExpense.categoryId).toBe(category.id);
    expect(item.accountId).toBe(account.id);
    expect(item.categoryId).toBe(category.id);
  });

  it.skip('returns structured validation errors', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/plans')
      .send({
        metadataId: 'invalid-plan',
        name: 'Invalid plan',
        startDate: 'not-a-date',
        status: 'active',
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(400);
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toBe('Validation failed');
        expect(body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'startDate' }),
          ]),
        );
        expect(body.path).toBe('/api/v1/plans');
        expect(body.timestamp).toBeDefined();
      });
  });

  it.skip('returns structured not found errors', async () => {
    await request(app.getHttpServer())
      .delete('/api/v1/plans/missing-plan/income-schedule')
      .expect(404)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(404);
        expect(body.error).toEqual({
          code: 'NOT_FOUND',
          message: 'Plan missing-plan was not found',
          details: null,
        });
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

async function clearDatabase(dataSource: DataSource) {
  for (const entity of [...plannerEntities].reverse()) {
    await dataSource.getRepository(entity).clear();
  }
}
