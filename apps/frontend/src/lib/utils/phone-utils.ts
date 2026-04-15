/**
 * Utility to standardize phone number formatting for the Salve Mundi platform.
 * Ensures consistent '06 12345678' style for Dutch numbers, bypassing '316' or '+31' artifacts.
 */
export function formatPhoneNumber(phone?: string | null): string {
    if (!phone) return '';

    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Handle Dutch prefixes
    if (cleaned.startsWith('+316')) {
        cleaned = '06' + cleaned.substring(4);
    } else if (cleaned.startsWith('316')) {
        cleaned = '06' + cleaned.substring(3);
    } else if (cleaned.startsWith('+31')) {
        cleaned = '0' + cleaned.substring(3);
    } else if (cleaned.startsWith('31')) {
        cleaned = '0' + cleaned.substring(2);
    }

    // Format as 06 12345678 if it's a standard Dutch mobile number
    if (cleaned.length === 10 && cleaned.startsWith('06')) {
        return `${cleaned.substring(0, 2)} ${cleaned.substring(2)}`;
    }

    // Fallback for other formats (like landlines or international)
    return cleaned;
}
