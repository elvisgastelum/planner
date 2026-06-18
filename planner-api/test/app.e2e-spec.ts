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

interface PlanResponseDto {
  id: string;
  metadataId: string;
  name: string;
  baseCurrency: string;
  startDate: string;
  endDate?: string | null;
  status: string;
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

  it('/api/v1/docs-json includes normalized schemas', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/docs-json')
      .expect(200);

    const document = response.body as OpenApiDocument;

    // Verify PlanResponseDto has baseCurrency, not currency
    expect(document.components.schemas.PlanResponseDto.properties).toHaveProperty('baseCurrency');
    expect(document.components.schemas.PlanResponseDto.properties).not.toHaveProperty('currency');

    // Verify key response DTOs exist
    expect(document.components.schemas).toHaveProperty('PlanResponseDto');
    expect(document.components.schemas).toHaveProperty('CategoryResponseDto');
    expect(document.components.schemas).toHaveProperty('AccountResponseDto');
    expect(document.components.schemas).toHaveProperty('TransactionResponseDto');
    expect(document.components.schemas).toHaveProperty('DashboardResponseDto');
    expect(document.components.schemas).toHaveProperty('CurrentBalanceResponseDto');
  });

  it('/api/v1/plans (POST, GET) with baseCurrency', async () => {
    const metadataId = `plan-test-${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/plans')
      .send({
        metadataId,
        name: 'Test financial plan',
        baseCurrency: 'MXN',
        startDate: '2026-06-11',
        endDate: '2026-08-14',
        status: 'active',
      })
      .expect(201);

    expect((createResponse.body as PlanResponseDto).id).toBeDefined();
    expect((createResponse.body as PlanResponseDto).metadataId).toBe(metadataId);
    expect((createResponse.body as PlanResponseDto).baseCurrency).toBe('MXN');

    await request(app.getHttpServer())
      .get('/api/v1/plans')
      .expect(200)
      .expect(({ body }: { body: PlanResponseDto[] }) => {
        expect(
          body.some(
            (plan: { metadataId: string }) => plan.metadataId === metadataId,
          ),
        ).toBe(true);
      });
  });

  it('full financial workflow', async () => {
    const metadataId = `workflow-${Date.now()}`;

    // a) Create plan with baseCurrency
    const planResponse = await request(app.getHttpServer())
      .post('/api/v1/plans')
      .send({
        metadataId,
        name: 'Workflow Plan',
        baseCurrency: 'MXN',
        startDate: '2026-06-01',
        status: 'active',
      })
      .expect(201);

    const planId = (planResponse.body as PlanResponseDto).id;

    // b) Create categories (idealPercentageBps totaling <= 10000)
    const needsResponse = await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/categories`)
      .send({
        code: 'needs',
        name: 'Needs',
        idealPercentageBps: 5000,
      })
      .expect(201);

    const wantsResponse = await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/categories`)
      .send({
        code: 'wants',
        name: 'Wants',
        idealPercentageBps: 3000,
      })
      .expect(201);

    const savingsResponse = await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/categories`)
      .send({
        code: 'savings',
        name: 'Savings',
        idealPercentageBps: 2000,
      })
      .expect(201);

    const needsId = (needsResponse.body as any).id;
    const wantsId = (wantsResponse.body as any).id;

    // c) Create checking account with openingBalanceCents
    const checkingResponse = await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/accounts`)
      .send({
        name: 'Checking Account',
        accountType: 'checking',
        openingBalanceCents: 500000, // 5000 MXN
        openingBalanceObservedAt: '2026-06-01T00:00:00.000Z',
      })
      .expect(201);

    const checkingId = (checkingResponse.body as any).id;

    // d) Create credit card account
    await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/accounts`)
      .send({
        name: 'Credit Card',
        accountType: 'credit_card',
        openingBalanceCents: 150000, // 1500 MXN liability (positive for amount owed)
      })
      .expect(201);

    // e) Get current balance for checking - should equal opening balance
    await request(app.getHttpServer())
      .get(`/api/v1/plans/${planId}/accounts/${checkingId}/current-balance`)
      .expect(200)
      .expect(({ body }: { body: any }) => {
        expect(body.balanceCents).toBe(500000);
      });

    // f) Create income source
    const sourceResponse = await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/income-sources`)
      .send({
        name: 'Main Job',
        currency: 'MXN',
      })
      .expect(201);

    const sourceId = (sourceResponse.body as any).id;

    // g) Create income schedule under source
    await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/income-sources/${sourceId}/schedules`)
      .send({
        cadence: 'monthly',
        anchorPaymentDate: '2026-06-15',
      })
      .expect(201);

    // h) Create income payment
    const paymentResponse = await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/income-payments`)
      .send({
        incomeSourceId: sourceId,
        paidOn: '2026-06-15',
        status: 'received',
      })
      .expect(201);

    const paymentId = (paymentResponse.body as any).id;

    // Create a deposit transaction for the income payment
    await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/transactions`)
      .send({
        occurredAt: '2026-06-15T10:00:00Z',
        transactionType: 'income',
        description: 'Salary deposit',
        entries: [
          {
            accountId: checkingId,
            amountCents: 250000, // positive deposit
          },
        ],
      })
      .expect(201);

    // i) Create budget period
    const periodResponse = await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/budget-periods`)
      .send({
        periodType: 'monthly',
        startsOn: '2026-06-01',
        endsOn: '2026-06-30',
        fundingAmountCents: 250000,
      })
      .expect(201);

    const periodId = (periodResponse.body as any).id;

    // j) Create budget item under period
    const itemResponse = await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/budget-periods/${periodId}/items`)
      .send({
        concept: 'Groceries',
        dueOn: '2026-06-15',
        plannedAmountCents: 50000,
        categoryId: needsId,
        sourceAccountId: checkingId,
      })
      .expect(201);

    const itemId = (itemResponse.body as any).id;

    // k) Create expense transaction with checking negative entry and budget allocation
    await request(app.getHttpServer())
      .post(`/api/v1/plans/${planId}/transactions`)
      .send({
        occurredAt: '2026-06-16T10:00:00Z',
        transactionType: 'expense',
        description: 'Grocery Store',
        categoryId: needsId,
        entries: [
          {
            accountId: checkingId,
            amountCents: -50000, // negative for expense from checking
          },
        ],
        budgetAllocations: [
          {
            budgetItemId: itemId,
            allocatedAmountCents: 50000,
          },
        ],
      })
      .expect(201);

    // l) Get checking current balance - should reflect income minus expense
    await request(app.getHttpServer())
      .get(`/api/v1/plans/${planId}/accounts/${checkingId}/current-balance`)
      .expect(200)
      .expect(({ body }: { body: any }) => {
        // 500000 (opening) + 250000 (income) - 50000 (expense) = 700000
        expect(body.balanceCents).toBe(700000);
      });

    // m) Get dashboard and assert response contains currentBalances array
    await request(app.getHttpServer())
      .get(`/api/v1/plans/${planId}/dashboard`)
      .expect(200)
      .expect(({ body }: { body: any }) => {
        expect(body).toHaveProperty('currentBalances');
        expect(Array.isArray(body.currentBalances)).toBe(true);
        expect(body.currentBalances.length).toBeGreaterThan(0);
      });
  });

  it('rejects cross-plan account reference', async () => {
    // Create first plan with account
    const plan1Response = await request(app.getHttpServer())
      .post('/api/v1/plans')
      .send({
        metadataId: `plan1-${Date.now()}`,
        name: 'Plan 1',
        baseCurrency: 'MXN',
        startDate: '2026-06-01',
        status: 'active',
      })
      .expect(201);

    const plan1Id = (plan1Response.body as PlanResponseDto).id;

    const accountResponse = await request(app.getHttpServer())
      .post(`/api/v1/plans/${plan1Id}/accounts`)
      .send({
        name: 'Plan 1 Checking',
        accountType: 'checking',
        openingBalanceCents: 100000,
      })
      .expect(201);

    const plan1AccountId = (accountResponse.body as any).id;

    // Create second plan
    const plan2Response = await request(app.getHttpServer())
      .post('/api/v1/plans')
      .send({
        metadataId: `plan2-${Date.now()}`,
        name: 'Plan 2',
        baseCurrency: 'MXN',
        startDate: '2026-06-01',
        status: 'active',
      })
      .expect(201);

    const plan2Id = (plan2Response.body as PlanResponseDto).id;

    // Try to create transaction in plan2 using plan1's account - should fail
    await request(app.getHttpServer())
      .post(`/api/v1/plans/${plan2Id}/transactions`)
      .send({
        occurredAt: '2026-06-16T10:00:00Z',
        transactionType: 'expense',
        description: 'Cross-plan expense',
        entries: [
          {
            accountId: plan1AccountId, // Wrong plan's account
            amountCents: -10000,
          },
        ],
      })
      .expect((res: any) => {
        // Accept 400, 404, or 422 - whatever the service returns
        expect([400, 404, 422]).toContain(res.status);
      });
  });

  it('returns validation error for POST plan missing required fields', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/plans')
      .send({
        metadataId: 'invalid-plan',
        // Missing required 'name' field
        startDate: '2026-06-01',
        status: 'active',
      })
      .expect(400)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.statusCode).toBe(400);
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toBe('Validation failed');
        expect(body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'name' }),
          ]),
        );
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
