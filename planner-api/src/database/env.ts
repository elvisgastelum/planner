import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_ENV_FILE = '.env';

function parseEnvFile(content: string): Record<string, string> {
  return content.split(/\r?\n/).reduce<Record<string, string>>((env, line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return env;
    }

    const equalsIndex = trimmed.indexOf('=');

    if (equalsIndex < 0) {
      return env;
    }

    const key = trimmed
      .slice(0, equalsIndex)
      .trim()
      .replace(/^export\s+/, '');

    if (!key) {
      return env;
    }

    let value = trimmed.slice(equalsIndex + 1).trim();

    if (!value.startsWith('"') && !value.startsWith("'")) {
      const commentIndex = value.search(/\s#/);

      if (commentIndex >= 0) {
        value = value.slice(0, commentIndex).trimEnd();
      }
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      env[key] = value;
    }

    return env;
  }, {});
}

export function loadEnvFile(
  envFilePath = resolve(process.cwd(), DEFAULT_ENV_FILE),
): void {
  if (!existsSync(envFilePath)) {
    return;
  }

  const parsedEnv = parseEnvFile(readFileSync(envFilePath, 'utf8'));

  for (const [key, value] of Object.entries(parsedEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function resolveDatabasePath(defaultPath = 'planner.sqlite'): string {
  return process.env.DATABASE_PATH ?? defaultPath;
}
