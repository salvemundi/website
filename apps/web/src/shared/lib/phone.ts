export function isValidPhoneNumber(input: string | undefined | null): boolean {
  if (!input) return false;
  const phone = String(input).trim();

  // Remove common separators and parentheses
  const cleaned = phone.replace(/[\s-.()]/g, '');

  // Must contain at least 6 digits and at most 15 (reasonable international range)
  const digits = cleaned.replace(/[^0-9+]/g, '');

  // If starts with +, ensure rest are digits and reasonable length
  if (digits.startsWith('+')) {
    const rest = digits.slice(1);
    return /^[0-9]{6,15}$/.test(rest);
  }

  // If starts with 0 (local format), require 8-12 digits after leading zeros removed
  if (/^0[0-9]+$/.test(digits)) {
    const num = digits.replace(/^0+/, '');
    return /^[0-9]{6,12}$/.test(num);
  }

  // Otherwise accept 6-15 digit numbers
  return /^[0-9]{6,15}$/.test(digits);
}
