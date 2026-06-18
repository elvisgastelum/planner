/**
 * Safe integer money handling utilities.
 *
 * All amounts are stored as integer cents to avoid floating-point errors.
 * These utilities convert between decimal strings and integer cents.
 */

/**
 * Asserts that a number is a safe integer.
 * @throws Error if the value is not a safe integer
 */
export function assertCents(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`Value ${value} is not a safe integer`);
  }
}

/**
 * Converts a decimal string to integer cents.
 *
 * @example
 * decimalStringToCents('123.45') // returns 12345
 * decimalStringToCents('-99.99') // returns -9999
 */
export function decimalStringToCents(decimal: string): number {
  // Remove leading/trailing whitespace
  const trimmed = decimal.trim();

  // Validate format: optional minus, digits, optional decimal point with 1-2 digits
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`Invalid decimal string: ${trimmed}`);
  }

  // Handle negative numbers by removing sign before parsing
  const isNegative = trimmed.startsWith('-');
  const absoluteValue = isNegative ? trimmed.slice(1) : trimmed;

  // Parse with fixed precision to avoid floating point issues
  const parts = absoluteValue.split('.');
  const dollars = parts[0] || '0';
  const centsPart = (parts[1] || '00').padEnd(2, '0').slice(0, 2);

  const result = parseInt(dollars, 10) * 100 + parseInt(centsPart, 10);

  // Apply negative sign if needed
  return isNegative ? -result : result;
}

/**
 * Converts integer cents to a decimal amount string.
 *
 * @example
 * centsToDecimalAmount(12345) // returns '123.45'
 * centsToDecimalAmount(-9999) // returns '-99.99'
 */
export function centsToDecimalAmount(cents: number): string {
  assertCents(cents);

  const isNegative = cents < 0;
  const absoluteCents = Math.abs(cents);

  const dollars = Math.floor(absoluteCents / 100);
  const centsRemainder = absoluteCents % 100;

  const result = `${dollars}.${centsRemainder.toString().padStart(2, '0')}`;

  return isNegative ? `-${result}` : result;
}

/**
 * Rounds a decimal number to the nearest cent.
 *
 * @example
 * roundToCents(123.456) // returns 12346 (123.46 cents)
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100);
}
