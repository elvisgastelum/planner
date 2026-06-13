import { DataSource } from 'typeorm';

import { plannerEntities } from '../planner/entities';
import { loadEnvFile, resolveDatabasePath } from './env';

loadEnvFile();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: resolveDatabasePath(),
  entities: plannerEntities,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
