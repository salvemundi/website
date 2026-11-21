// Shared fail-closed policy, kept independent from Next.js for automated verification.
export function mobileEnabled(): boolean {
    return process.env.ENV_NAME === 'acc' && process.env.MOBILE_API_ENABLED === 'true';
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
