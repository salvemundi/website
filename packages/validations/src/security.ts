import { timingSafeEqual, createHmac } from 'node:crypto';

/**
 * Perform a timing-safe comparison of two strings.
 * This function uses HMAC to normalize the length of the strings before comparison,
 * which prevents length-based timing attacks and handles strings of different lengths.
 * 
 * @param a The first string to compare (e.g., the provided token)
 * @param b The second string to compare (e.g., the expected secret)
 * @returns True if the strings are equal, false otherwise
 */
export function timingSafeCompare(a: string, b: string): boolean {
    if (!a || !b) return false;

    // Use a static key for HMAC. This key doesn't need to be secret as its
    // only purpose is to normalize lengths for timing-safe comparison.
    const hmacKey = 'normalized-length-salt';
    
    const hmacA = createHmac('sha256', hmacKey).update(a).digest();
    const hmacB = createHmac('sha256', hmacKey).update(b).digest();

    return timingSafeEqual(hmacA, hmacB);
}
