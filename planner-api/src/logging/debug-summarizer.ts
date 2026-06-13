function truncate(text: string, maxLength = 220) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function summarizeValueInternal(
  value: unknown,
  seen: WeakSet<object>,
): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return truncate(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncate(value.message),
      stack: value.stack ? truncate(value.stack, 500) : undefined,
    };
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return '[Circular]';
    }

    seen.add(value);

    return {
      type: 'array',
      length: value.length,
      sample: value
        .slice(0, 3)
        .map((item) => summarizeValueInternal(item, seen)),
    };
  }
  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]';
    }

    seen.add(value);

    const entries = Object.entries(value as Record<string, unknown>)
      .slice(0, 10)
      .map(
        ([key, entryValue]) =>
          [key, summarizeValueInternal(entryValue, seen)] as const,
      );
    return Object.fromEntries(entries);
  }
  return String(value);
}

export function summarizeValue(value: unknown): unknown {
  return summarizeValueInternal(value, new WeakSet<object>());
}

export function formatDebugMessage(label: string, payload?: unknown): string {
  if (payload === undefined) {
    return label;
  }

  try {
    return `${label} ${JSON.stringify(summarizeValue(payload))}`;
  } catch {
    return `${label} [unserializable payload]`;
  }
}
