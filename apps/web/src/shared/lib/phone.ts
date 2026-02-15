import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Validates a phone number using libphonenumber-js.
 * Defaults to NL (Netherlands) if no country code is provided.
 */
export function isValidPhoneNumber(input: string | undefined | null): boolean {
  if (!input) return false;
  try {
    const phoneNumber = parsePhoneNumberFromString(input, 'NL');
    return phoneNumber ? phoneNumber.isValid() : false;
  } catch (error) {
    return false;
  }
}

/**
 * Formats a phone number to the official international format (+31 6 ...).
 * If the number is not valid, returns the original input.
 */
export function formatPhoneNumber(input: string | undefined | null): string {
  if (!input) return '';
  try {
    const phoneNumber = parsePhoneNumberFromString(input, 'NL');
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatInternational();
    }
  } catch (error) {
    // Fallback to original
  }
  return String(input);
}
