import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

import { loadEnvFile, resolveDatabasePath } from './env';

loadEnvFile();

export function resolveDatabaseArtifacts(databasePath: string): string[] {
  if (databasePath === ':memory:') {
    return [];
  }

  const filePath = databasePath.startsWith('file:')
    ? databasePath.slice('file:'.length).split(/[?#]/, 1)[0]
    : databasePath;

  const resolvedPath = resolve(process.cwd(), filePath);

  return [
    resolvedPath,
    `${resolvedPath}-journal`,
    `${resolvedPath}-shm`,
    `${resolvedPath}-wal`,
  ];
}

export function cleanDatabase(databasePath = resolveDatabasePath()): void {
  const databaseArtifacts = resolveDatabaseArtifacts(databasePath);

  for (const artifact of databaseArtifacts) {
    rmSync(artifact, { force: true });
  }
}

if (require.main === module) {
  cleanDatabase();
}
