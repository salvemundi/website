import jwt from 'jsonwebtoken';

const SERVICE_SECRET = process.env.SERVICE_SECRET;

if (!SERVICE_SECRET) {
    console.warn('⚠️ SERVICE_SECRET is not defined in environment variables');
}

/**
 * Creates a signed JWT for service-to-service communication.
 * @param payload Data to include in the token (e.g., { iss: 'frontend' })
 * @param expiresIn Expiration time (default 1 hour)
 */
export function createServiceToken(payload: object = { iss: 'frontend' }, expiresIn: string = '1h'): string {
    if (!SERVICE_SECRET) {
        throw new Error('SERVICE_SECRET is required to sign service tokens');
    }
    return jwt.sign(payload, SERVICE_SECRET, { expiresIn });
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
        return jwt.verify(token, SERVICE_SECRET);
    } catch (error) {
        return null;
    }
}
