import { statSync } from 'node:fs';
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

/**
 * Cleans database artifacts from disk.
 *
 * @param databasePath - Path to the database file, defaults to resolved DATABASE_PATH
 * @throws Error if attempting to clean unsafe paths
 */
export function cleanDatabase(databasePath = resolveDatabasePath()): void {
  const databaseArtifacts = resolveDatabaseArtifacts(databasePath);

  if (databaseArtifacts.length === 0) {
    return; // :memory: case
  }

  // Safety guards
  const resolvedPath = resolve(
    process.cwd(),
    databasePath.startsWith('file:')
      ? databasePath.slice('file:'.length).split(/[?#]/, 1)[0]
      : databasePath,
  );

  // Guard 1: Refuse ':memory:' (no-op, but explicit check)
  if (databasePath === ':memory:') {
    return;
  }

  // Guard 2: Refuse root directory
  if (resolvedPath === '/' || resolvedPath === '\\') {
    throw new Error(`Refusing to clean root directory: ${resolvedPath}`);
  }

  // Guard 3: Refuse CWD itself
  if (resolvedPath === process.cwd()) {
    throw new Error(
      `Refusing to clean current working directory: ${resolvedPath}`,
    );
  }

  // Guard 4: Check if path is a directory
  try {
    const stats = statSync(resolvedPath);
    if (stats.isDirectory()) {
      throw new Error(`Refusing to clean directory: ${resolvedPath}`);
    }
  } catch (error) {
    // If file doesn't exist, that's fine - we'll just try to remove artifacts
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      throw error;
    }
  }

  // Guard 5: Ensure path is within CWD unless DATABASE_PATH was explicitly absolute via env
  const isExplicitAbsolute =
    databasePath === process.env.DATABASE_PATH && process.env.DATABASE_PATH
      ? resolve(process.env.DATABASE_PATH) === process.env.DATABASE_PATH
      : false;

  if (!isExplicitAbsolute && !resolvedPath.startsWith(process.cwd())) {
    throw new Error(`Refusing to clean path outside CWD: ${resolvedPath}`);
  }

  // Safe to clean
  for (const artifact of databaseArtifacts) {
    rmSync(artifact, { force: true });
  }
}

if (require.main === module) {
  cleanDatabase();
}
