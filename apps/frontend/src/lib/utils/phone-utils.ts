/**
 * Utility to standardize phone number formatting for the Salve Mundi platform.
 * Ensures consistent E.164 '+31 6 12345678' style for Dutch mobile numbers, prepending + and country codes as needed.
 */
export function formatPhoneNumber(phone?: string | null): string {
    if (!phone) return '';

    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Convert standard Dutch prefixes to international +31 format
    if (cleaned.startsWith('06')) {
        cleaned = '+316' + cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
        cleaned = '+31' + cleaned.substring(1);
    } else if (cleaned.startsWith('31') && !cleaned.startsWith('+31')) {
        cleaned = '+' + cleaned;
    } else if (cleaned.length > 0 && !cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }

    // Format Dutch mobile numbers (+316xxxxxxxx) nicely: +31 6 12345678
    if (cleaned.startsWith('+316') && cleaned.length === 12) {
        return `+31 6 ${cleaned.substring(4)}`;
    }

    // Fallback for other formats (like landlines or other international numbers)
    return cleaned;
}
