import { DataSource } from 'typeorm';

import { loadEnvFile, resolveDatabasePath } from './env';
import { isDebugLoggingEnabled } from '../logging/debug-config';
import { plannerEntities } from '../planner/entities';

loadEnvFile();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: resolveDatabasePath(),
  entities: plannerEntities,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: isDebugLoggingEnabled()
    ? ['query', 'error', 'warn']
    : ['error', 'warn'],
  logger: isDebugLoggingEnabled() ? 'advanced-console' : 'simple-console',
  maxQueryExecutionTime: isDebugLoggingEnabled() ? 250 : 1000,
});
