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

interface OpenApiDocument {
  paths: Record<
    string,
    Record<
      string,
      {
        responses: Record<
          string,
          { content: Record<string, { schema: unknown }> }
        >;
      }
    >
  >;
  components: {
    schemas: Record<
      string,
      {
        properties?: Record<
          string,
          { type?: string; enum?: unknown[]; $ref?: string }
        >;
      }
    >;
  };
}

interface FinancialPlanResponse {
  id: string;
  metadataId: string;
  name: string;
  currency: string;
  startDate: string;
  endDate?: string;
  status: string;
}

interface StatsResponse {
  accountsCount: number;
  incomePaymentsCount: number;
  paymentPeriodsCount: number;
  recurringExpensesCount: number;
  completedItemsCount: number;
  plannedTotal: number;
  plannedRemaining: number;
  completedTotal: number;
}

interface CategoryLightResponse {
  id: string;
  key: string;
  name: string;
  idealPercentage: number;
}

interface ApiErrorResponse {
  statusCode: number;
  error: {
    code: string;
    message: string;
    details: unknown;
  };
  path: string;
  timestamp: string;
}

interface DeleteResult {
  deleted: boolean;
}

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
    await dataSource.runMigrations();
  });

  beforeEach(async () => {
    await clearDatabase(dataSource);
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }: { body: { status: string } }) => {
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

    const document = response.body as OpenApiDocument;
    const getResponseSchema = (path: string, method: string, status: string) =>
      document.paths[path][method].responses[status].content['application/json']
        .schema;

    expect(getResponseSchema('/api/v1/plans', 'get', '200')).toEqual({
      items: { $ref: '#/components/schemas/FinancialPlanResponseDto' },
      type: 'array',
    });
    expect(getResponseSchema('/api/v1/plans/{planId}', 'get', '200')).toEqual({
      $ref: '#/components/schemas/FinancialPlanResponseDto',
    });
    expect(
      getResponseSchema('/api/v1/plans/{planId}/payment-periods', 'get', '200'),
    ).toEqual({
      items: { $ref: '#/components/schemas/PaymentPeriodSummaryResponseDto' },
      type: 'array',
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
      getResponseSchema('/api/v1/plans/{planId}/completed-items', 'get', '200'),
    ).toEqual({
      items: { $ref: '#/components/schemas/CompletedItemResponseDto' },
      type: 'array',
    });
    expect(
      document.components.schemas.PaymentPeriodSummaryResponseDto.properties
        .itemsCount.type,
    ).toBe('number');
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

    expect((createResponse.body as FinancialPlanResponse).id).toBeDefined();
    expect((createResponse.body as FinancialPlanResponse).metadataId).toBe(
      metadataId,
    );

    await request(app.getHttpServer())
      .get('/api/v1/plans')
      .expect(200)
      .expect(({ body }: { body: FinancialPlanResponse[] }) => {
        expect(
          body.some(
            (plan: { metadataId: string }) => plan.metadataId === metadataId,
          ),
        ).toBe(true);
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

    const planId = (createPlanResponse.body as FinancialPlanResponse).id;

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
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body as DeleteResult).toEqual({ deleted: true });
      });

    await request(app.getHttpServer())
      .get(`/api/v1/plans/${planId}/income-schedule`)
      .expect(404)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.error).toEqual({
          code: 'NOT_FOUND',
          message: `Plan ${planId} has no income schedule`,
          details: null,
        });
      });
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
      .expect(({ body }: { body: ApiErrorResponse }) => {
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
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.statusCode).toBe(404);
        expect(body.error).toEqual({
          code: 'NOT_FOUND',
          message: 'Plan missing-plan was not found',
          details: null,
        });
      });
  });

  it('/api/v1/plans/:planId/stats (GET)', async () => {
    const metadataId = `stats-test-${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/plans')
      .send({
        metadataId,
        name: 'Stats test plan',
        currency: 'MXN',
        startDate: '2026-06-11',
        status: 'active',
      })
      .expect(201);

    const planId = (createResponse.body as FinancialPlanResponse).id;

    await request(app.getHttpServer())
      .get(`/api/v1/plans/${planId}/stats`)
      .expect(200)
      .expect(({ body }: { body: StatsResponse }) => {
        expect(body.accountsCount).toBe(0);
        expect(body.incomePaymentsCount).toBe(0);
        expect(body.paymentPeriodsCount).toBe(0);
        expect(body.recurringExpensesCount).toBe(0);
        expect(body.completedItemsCount).toBe(0);
        expect(body.plannedTotal).toBe(0);
        expect(body.plannedRemaining).toBe(0);
        expect(body.completedTotal).toBe(0);
      });
  });

  it('/api/v1/plans/:planId/categories/light (GET)', async () => {
    const metadataId = `categories-light-test-${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/plans')
      .send({
        metadataId,
        name: 'Categories light test plan',
        currency: 'MXN',
        startDate: '2026-06-11',
        status: 'active',
      })
      .expect(201);

    const planId = (createResponse.body as FinancialPlanResponse).id;

    // Create a category first
    await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/categories`)
      .send({
        key: 'housing',
        name: 'Housing',
        idealPercentage: 40,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/plans/${planId}/categories/light`)
      .expect(200)
      .expect(({ body }: { body: CategoryLightResponse[] }) => {
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBe(1);
        expect(body[0].id).toBeDefined();
        expect(body[0].key).toBe('housing');
        expect(body[0].name).toBe('Housing');
        expect(body[0].idealPercentage).toBe(40);
      });
  });

  it('/api/v1/plans/:planId/categories/percentages (PATCH) - accepts total 100', async () => {
    const metadataId = `bulk-percentages-test-${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/plans')
      .send({
        metadataId,
        name: 'Bulk percentages test plan',
        currency: 'MXN',
        startDate: '2026-06-11',
        status: 'active',
      })
      .expect(201);

    const planId = (createResponse.body as FinancialPlanResponse).id;

    // Create two categories
    const cat1Response = await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/categories`)
      .send({
        key: 'housing',
        name: 'Housing',
        idealPercentage: 50,
      })
      .expect(201);

    const cat2Response = await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/categories`)
      .send({
        key: 'food',
        name: 'Food',
        idealPercentage: 50,
      })
      .expect(201);

    const cat1Id = (cat1Response.body as FinancialPlanResponse).id;
    const cat2Id = (cat2Response.body as FinancialPlanResponse).id;

    // Update percentages to total 100
    await request(app.getHttpServer())
      .patch(`/api/v1/plans/${planId}/categories/percentages`)
      .send({
        categories: [
          { categoryId: cat1Id, idealPercentage: 60 },
          { categoryId: cat2Id, idealPercentage: 40 },
        ],
      })
      .expect(200)
      .expect(({ body }: { body: CategoryLightResponse[] }) => {
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBe(2);
      });
  });

  it('/api/v1/plans/:planId/categories/percentages (PATCH) - rejects total != 100', async () => {
    const metadataId = `bulk-percentages-reject-test-${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/plans')
      .send({
        metadataId,
        name: 'Bulk percentages reject test plan',
        currency: 'MXN',
        startDate: '2026-06-11',
        status: 'active',
      })
      .expect(201);

    const planId = (createResponse.body as FinancialPlanResponse).id;

    // Create a category
    const catResponse = await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/categories`)
      .send({
        key: 'housing',
        name: 'Housing',
        idealPercentage: 50,
      })
      .expect(201);

    const catId = (catResponse.body as FinancialPlanResponse).id;

    // Try to update with total != 100
    await request(app.getHttpServer())
      .patch(`/api/v1/plans/${planId}/categories/percentages`)
      .send({
        categories: [{ categoryId: catId, idealPercentage: 50 }],
      })
      .expect(400)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.statusCode).toBe(400);
        expect(body.error.code).toBe('BAD_REQUEST');
      });
  });

  it('/api/v1/plans/:planId/categories/percentages (PATCH) - rejects nonexistent category', async () => {
    const metadataId = `bulk-percentages-nonexistent-test-${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/plans')
      .send({
        metadataId,
        name: 'Bulk percentages nonexistent test plan',
        currency: 'MXN',
        startDate: '2026-06-11',
        status: 'active',
      })
      .expect(201);

    const planId = (createResponse.body as FinancialPlanResponse).id;

    // Try to update nonexistent category
    await request(app.getHttpServer())
      .patch(`/api/v1/plans/${planId}/categories/percentages`)
      .send({
        categories: [{ categoryId: 'nonexistent-id', idealPercentage: 100 }],
      })
      .expect(400)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.statusCode).toBe(400);
        expect(body.error.code).toBe('BAD_REQUEST');
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
