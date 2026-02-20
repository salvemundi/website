import { sign, verify } from 'jsonwebtoken';

const SERVICE_SECRET = process.env.SERVICE_SECRET;

if (!SERVICE_SECRET) {
    console.warn('⚠️ SERVICE_SECRET is not defined in environment variables');
}

/**
 * Creates a signed JWT for service-to-service communication.
 * @param payload Data to include in the token (e.g., { iss: 'frontend' })
 * @param expiresIn Expiration time (default 1 hour)
 */
export function createServiceToken(payload: any = { iss: 'frontend' }, expiresIn: string = '1h'): string {
    if (!SERVICE_SECRET) {
        throw new Error('SERVICE_SECRET is required to sign service tokens');
    }
    const token = sign(payload, SERVICE_SECRET, { expiresIn });
    console.log(`[service-auth] Created token for ${payload.iss || 'unknown'}. Secret defined: ${!!SERVICE_SECRET}, Secret start: ${SERVICE_SECRET.substring(0, 3)}...`);
    // @ts-ignore
    return token;
}

/**
 * Verifies a service token signature.
 * @param token The JWT string to verify
 */
export function verifyServiceToken(token: string): any {
    if (!SERVICE_SECRET) {
        throw new Error('SERVICE_SECRET is required to verify service tokens');
    }
    try {
        // @ts-ignore
        return verify(token, SERVICE_SECRET);
    } catch (error) {
        return null;
    }
}
