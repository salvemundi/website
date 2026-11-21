// Shared fail-closed policy, kept independent from Next.js for automated verification.

// Non-production environments where the native app backend may run: acceptance and the isolated dev environment.
// Production is never included, whatever its variables say.
const MOBILE_ENVIRONMENTS: Record<string, string> = {
    acc: 'https://acc.salvemundi.nl',
    dev: 'https://dev.salvemundi.nl',
};

export function mobileEnvironmentName(): string | null {
    const name = process.env.ENV_NAME || '';
    return Object.prototype.hasOwnProperty.call(MOBILE_ENVIRONMENTS, name) ? name : null;
}

export function mobileEnabled(): boolean {
    return mobileEnvironmentName() !== null && process.env.MOBILE_API_ENABLED === 'true';
}

/** Public origin for links the API returns (website, assets). Fixed per environment, never taken from request headers. */
export function mobilePublicOrigin(): string {
    return MOBILE_ENVIRONMENTS[mobileEnvironmentName() || 'acc'];
}

/** Login origins the mobile auth flow accepts: the environment's own origin, or a local http development server. */
export function mobileAllowedAuthOrigin(origin: string): boolean {
    const url = new URL(origin);
    if (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)) return true;
    return mobileEnvironmentName() !== null && origin === mobilePublicOrigin();
}

export function mobileAssociationID(): string | null {
    const teamID = process.env.MOBILE_APPLE_TEAM_ID || '';
    return mobileEnabled() && /^[A-Z0-9]{10}$/.test(teamID) ? `${teamID}.nl.salvemundi.ios` : null;
}

export type MobilePlatform = 'ios' | 'android';
export const MOBILE_ANDROID_PACKAGE_NAME = 'nl.salvemundi.android';
// APNs device tokens are hex; FCM registration tokens are opaque URL-safe strings (case-sensitive).
export const APNS_TOKEN_PATTERN = /^[a-fA-F0-9]{64,200}$/;
export const FCM_TOKEN_PATTERN = /^[A-Za-z0-9_:-]{100,1024}$/;

// Closed allowlist; anything unknown or missing is treated as the original iOS client.
export function mobileClientPlatform(request: { headers: { get(name: string): string | null } }): MobilePlatform {
    return request.headers.get('x-client-platform')?.trim().toLowerCase() === 'android' ? 'android' : 'ios';
}

export function validDeviceToken(platform: MobilePlatform, token: string): boolean {
    return platform === 'android' ? FCM_TOKEN_PATTERN.test(token) : APNS_TOKEN_PATTERN.test(token);
}

// Android App Links: requires the same acceptance gate as the Apple association file
// plus explicitly configured signing-certificate fingerprints. No fingerprints: no file.
export function mobileAndroidAssociation(): { packageName: string; fingerprints: string[] } | null {
    if (!mobileEnabled()) return null;
    const fingerprints = (process.env.MOBILE_ANDROID_SHA256_CERT_FINGERPRINTS || '').split(',').map(value => value.trim().toUpperCase()).filter(Boolean);
    const validFingerprint = (value: string) => { const bytes = value.split(':'); return bytes.length === 32 && bytes.every(byte => /^[0-9A-F]{2}$/.test(byte)); };
    if (!fingerprints.length || !fingerprints.every(validFingerprint)) return null;
    const packageName = process.env.MOBILE_ANDROID_PACKAGE_NAME?.trim() || MOBILE_ANDROID_PACKAGE_NAME;
    const segments = packageName.split('.');
    if (packageName.length > 255 || segments.length < 2 || !segments.every(segment => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(segment))) return null;
    return { packageName, fingerprints: [...new Set(fingerprints)] };
}
