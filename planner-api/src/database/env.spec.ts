import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { cleanDatabase, resolveDatabaseArtifacts } from './clean-db';
import { loadEnvFile } from './env';

describe('database env helpers', () => {
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  let tempDir = '';

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'planner-api-db-'));
  });

  afterEach(() => {
    process.chdir(originalCwd);

    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value !== undefined) {
        process.env[key] = value;
      }
    }

    rmSync(tempDir, { force: true, recursive: true });
  });

  it('loads values from an env file', () => {
    const envFile = join(tempDir, '.env');

    writeFileSync(
      envFile,
      [
        'DATABASE_PATH=test.sqlite',
        'PORT=4500',
        'QUOTED="hello world"',
        'INLINE_COMMENT=hello # comment',
        'export EXPORTED=value',
        '',
      ].join('\n'),
    );

    delete process.env.DATABASE_PATH;
    delete process.env.PORT;
    delete process.env.QUOTED;
    delete process.env.INLINE_COMMENT;
    delete process.env.EXPORTED;

    loadEnvFile(envFile);

    expect(process.env.DATABASE_PATH).toBe('test.sqlite');
    expect(process.env.PORT).toBe('4500');
    expect(process.env.QUOTED).toBe('hello world');
    expect(process.env.INLINE_COMMENT).toBe('hello');
    expect(process.env.EXPORTED).toBe('value');
  });

  it('resolves database artifacts for cleanup', () => {
    process.chdir(tempDir);

    expect(resolveDatabaseArtifacts('planner.sqlite')).toEqual([
      resolve(tempDir, 'planner.sqlite'),
      `${resolve(tempDir, 'planner.sqlite')}-journal`,
      `${resolve(tempDir, 'planner.sqlite')}-shm`,
      `${resolve(tempDir, 'planner.sqlite')}-wal`,
    ]);

    expect(resolveDatabaseArtifacts('file:data/app.sqlite?mode=rwc')).toEqual([
      resolve(tempDir, 'data/app.sqlite'),
      `${resolve(tempDir, 'data/app.sqlite')}-journal`,
      `${resolve(tempDir, 'data/app.sqlite')}-shm`,
      `${resolve(tempDir, 'data/app.sqlite')}-wal`,
    ]);

    expect(resolveDatabaseArtifacts(':memory:')).toEqual([]);
  });

  it('removes sqlite files and sidecars', () => {
    process.chdir(tempDir);
    process.env.DATABASE_PATH = 'planner.sqlite';

    for (const artifact of resolveDatabaseArtifacts('planner.sqlite')) {
      mkdirSync(resolve(artifact, '..'), { recursive: true });
      writeFileSync(artifact, 'test');
      expect(existsSync(artifact)).toBe(true);
    }

    cleanDatabase();

    for (const artifact of resolveDatabaseArtifacts('planner.sqlite')) {
      expect(existsSync(artifact)).toBe(false);
    }
  });
});
