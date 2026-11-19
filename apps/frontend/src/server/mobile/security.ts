import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const MOBILE_CALLBACK = 'salvemundi://auth/callback';
export function hashMobileToken(value: string): string {
    return `mobile-sha256:${createHash('sha256').update(value).digest('hex')}`;
}
export function newMobileToken(): string { return `smi_${randomBytes(32).toString('base64url')}`; }
export function newOpaqueCode(): string { return randomBytes(32).toString('base64url'); }
export function validChallenge(value: string): boolean { return /^[A-Za-z0-9_-]{43}$/.test(value); }
export function validVerifier(value: string): boolean { return /^[A-Za-z0-9._~-]{43,128}$/.test(value); }
export function verifyPKCE(verifier: string, challenge: string): boolean {
    if (!validVerifier(verifier) || !validChallenge(challenge)) return false;
    const expected = createHash('sha256').update(verifier).digest('base64url');
    return timingSafeEqual(Buffer.from(expected), Buffer.from(challenge));
}
export function isNativeToken(value: string): boolean { return /^smi_[A-Za-z0-9_-]{43}$/.test(value); }

export function validBrowserFlowCookie(cookie: string, flowId: string, expectedHash: string): boolean {
    const parts = cookie.split('.');
    if (parts.length !== 2) return false;
    const [cookieFlow, nonce] = parts;
    if (cookieFlow !== flowId || !nonce || !validChallenge(nonce)) return false;
    const actual = hashMobileToken(nonce);
    return actual.length === expectedHash.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expectedHash));
}
