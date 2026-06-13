import { networkInterfaces } from 'node:os';

import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

import { AppModule } from './app.module';
import { createValidationPipe, StructuredHttpExceptionFilter } from './http';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.get(DataSource).runMigrations();

  app.enableCors({
    origin: ['http://localhost:5173', 'https://planner.elvisgastelum.com'],
  });
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new StructuredHttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Financial Planner API')
    .setDescription('Versioned API for normalized financial plans')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');

  const localIpv4Url = `http://127.0.0.1:${port}`;
  const lanUrls = Object.values(networkInterfaces())
    .flatMap((networkInterface) => networkInterface ?? [])
    .filter((address) => address.family === 'IPv4' && !address.internal)
    .map((address) => `http://${address.address}:${port}`);

  logger.log(`Server running locally at ${localIpv4Url}`);
  for (const lanUrl of lanUrls) {
    logger.log(`Server available on LAN at ${lanUrl}`);
  }
  logger.log(`Swagger docs available at ${localIpv4Url}/api/v1/docs`);
  logger.log(`Swagger JSON available at ${localIpv4Url}/api/v1/docs-json`);
}

void bootstrap();
