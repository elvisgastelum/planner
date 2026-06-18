import { DataSource } from 'typeorm';

/**
 * Enables SQLite foreign key constraints and verifies they are active.
 *
 * SQLite disables foreign key constraints by default. This function must be
 * called after opening a connection to ensure referential integrity.
 *
 * @param dataSource - The TypeORM DataSource to enable foreign keys on
 * @throws Error if foreign keys cannot be enabled
 */
export async function enableSqliteForeignKeys(
  dataSource: DataSource,
): Promise<void> {
  // Enable foreign keys
  await dataSource.query('PRAGMA foreign_keys = ON');

  // Verify foreign keys are enabled
  const result = await dataSource.query('PRAGMA foreign_keys');

  // SQLite returns [{ foreign_keys: 1 }] when enabled
  const isEnabled = Array.isArray(result) && result[0]?.foreign_keys === 1;

  if (!isEnabled) {
    throw new Error('Failed to enable SQLite foreign key constraints');
  }
}
