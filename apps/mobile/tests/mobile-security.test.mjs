import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verifyPKCE, validChallenge, hashMobileToken, newMobileToken, isNativeToken, MOBILE_CALLBACK, newOpaqueCode, validBrowserFlowCookie } from '../../frontend/src/server/mobile/security.ts';
import { mobileEnabled, mobileAssociationID, mobileAndroidAssociation, mobileClientPlatform, validDeviceToken, mobilePublicOrigin, mobileAllowedAuthOrigin, mobileEnvironmentName } from '../../frontend/src/server/mobile/policy.ts';
import { readFileSync } from 'node:fs';

test('native session secrets are random, hashed, and cannot be replayed using the stored value', () => {
    const first = newMobileToken();
    const second = newMobileToken();
    assert.notEqual(first, second);
    assert.equal(isNativeToken(first), true);
    assert.equal(hashMobileToken(first).startsWith('mobile-sha256:'), true);
    assert.equal(isNativeToken(hashMobileToken(first)), false);
    assert.notEqual(hashMobileToken(first), first);
    assert.notEqual(hashMobileToken(first), hashMobileToken(second));
});
test('PKCE accepts RFC7636 S256 vector and rejects modified verifier and malformed challenges', () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
    assert.equal(verifyPKCE(verifier, challenge), true);
    assert.equal(verifyPKCE(verifier + 'a', challenge), false);
    assert.equal(verifyPKCE('short', challenge), false);
    assert.equal(verifyPKCE(verifier, 'A'.repeat(300)), false);
    assert.equal(validChallenge('x'.repeat(43)), true);
    assert.equal(validChallenge('x'.repeat(42)), false);
    assert.equal(verifyPKCE(verifier, createHash('sha256').update(verifier).digest('hex')), false);
});
test('mobile APIs are unavailable in production even if the enable switch is set', () => {
    const original = { env: process.env.ENV_NAME, enabled: process.env.MOBILE_API_ENABLED };
    try {
        for (const env of ['prod', 'production', '', 'development']) {
            process.env.ENV_NAME = env; process.env.MOBILE_API_ENABLED = 'true';
            assert.equal(mobileEnabled(), false);
        }
        process.env.ENV_NAME = 'acc'; process.env.MOBILE_API_ENABLED = 'false';
        assert.equal(mobileEnabled(), false);
        process.env.MOBILE_API_ENABLED = 'true'; assert.equal(mobileEnabled(), true);
        // The isolated dev environment uses the same switch.
        process.env.ENV_NAME = 'dev'; assert.equal(mobileEnabled(), true);
        process.env.MOBILE_API_ENABLED = 'false'; assert.equal(mobileEnabled(), false);
    } finally {
        if (original.env === undefined) delete process.env.ENV_NAME; else process.env.ENV_NAME = original.env;
        if (original.enabled === undefined) delete process.env.MOBILE_API_ENABLED; else process.env.MOBILE_API_ENABLED = original.enabled;
    }
});
test('public links and login origin are fixed per environment, never production', () => {
    const original = { env: process.env.ENV_NAME, enabled: process.env.MOBILE_API_ENABLED };
    try {
        process.env.MOBILE_API_ENABLED = 'true';
        process.env.ENV_NAME = 'acc';
        assert.equal(mobilePublicOrigin(), 'https://acc.salvemundi.nl');
        assert.equal(mobileAllowedAuthOrigin('https://acc.salvemundi.nl'), true);
        assert.equal(mobileAllowedAuthOrigin('https://dev.salvemundi.nl'), false);
        process.env.ENV_NAME = 'dev';
        assert.equal(mobilePublicOrigin(), 'https://dev.salvemundi.nl');
        assert.equal(mobileAllowedAuthOrigin('https://dev.salvemundi.nl'), true);
        assert.equal(mobileAllowedAuthOrigin('https://acc.salvemundi.nl'), false);
        assert.equal(mobileAllowedAuthOrigin('http://localhost:3000'), true);
        assert.equal(mobileAllowedAuthOrigin('https://evil.example'), false);
        process.env.ENV_NAME = 'prod';
        assert.equal(mobileEnvironmentName(), null);
        assert.equal(mobileAllowedAuthOrigin('https://salvemundi.nl'), false);
    } finally {
        if (original.env === undefined) delete process.env.ENV_NAME; else process.env.ENV_NAME = original.env;
        if (original.enabled === undefined) delete process.env.MOBILE_API_ENABLED; else process.env.MOBILE_API_ENABLED = original.enabled;
    }
});
test('callback is one fixed app-owned route, not an arbitrary redirect', () => {
    assert.equal(MOBILE_CALLBACK, 'salvemundi://auth/callback');
});

test('Apple association requires acceptance switch and a valid real Apple Team ID', () => {
    const original = { env: process.env.ENV_NAME, enabled: process.env.MOBILE_API_ENABLED, team: process.env.MOBILE_APPLE_TEAM_ID };
    try {
        process.env.ENV_NAME = 'acc'; process.env.MOBILE_API_ENABLED = 'true';
        delete process.env.MOBILE_APPLE_TEAM_ID; assert.equal(mobileAssociationID(), null);
        process.env.MOBILE_APPLE_TEAM_ID = 'wrong'; assert.equal(mobileAssociationID(), null);
        process.env.MOBILE_APPLE_TEAM_ID = 'AB123CD456'; assert.equal(mobileAssociationID(), 'AB123CD456.nl.salvemundi.ios');
        process.env.ENV_NAME = 'prod'; assert.equal(mobileAssociationID(), null);
    } finally {
        for (const [key, value] of [['ENV_NAME', original.env], ['MOBILE_API_ENABLED', original.enabled], ['MOBILE_APPLE_TEAM_ID', original.team]]) {
            if (value === undefined) delete process.env[key]; else process.env[key] = value;
        }
    }
});

test('Android asset links require the acceptance switch and valid SHA-256 certificate fingerprints', () => {
    const keys = ['ENV_NAME', 'MOBILE_API_ENABLED', 'MOBILE_ANDROID_PACKAGE_NAME', 'MOBILE_ANDROID_SHA256_CERT_FINGERPRINTS'];
    const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
    const fingerprint = Array.from({ length: 32 }, (_, i) => i.toString(16).padStart(2, '0').toUpperCase()).join(':');
    try {
        process.env.ENV_NAME = 'acc'; process.env.MOBILE_API_ENABLED = 'true'; delete process.env.MOBILE_ANDROID_PACKAGE_NAME;
        delete process.env.MOBILE_ANDROID_SHA256_CERT_FINGERPRINTS; assert.equal(mobileAndroidAssociation(), null);
        for (const bad of ['wrong', fingerprint.slice(3), `${fingerprint}:AA`, fingerprint.replace(/:/g, ''), `${fingerprint},nope`]) {
            process.env.MOBILE_ANDROID_SHA256_CERT_FINGERPRINTS = bad; assert.equal(mobileAndroidAssociation(), null, bad);
        }
        const second = fingerprint.replace(/^00/, 'FF');
        process.env.MOBILE_ANDROID_SHA256_CERT_FINGERPRINTS = ` ${fingerprint.toLowerCase()} , ${second},${fingerprint}`;
        assert.deepEqual(mobileAndroidAssociation(), { packageName: 'nl.salvemundi.android', fingerprints: [fingerprint, second] });
        process.env.MOBILE_ANDROID_PACKAGE_NAME = 'nl.salvemundi.android.acc'; assert.equal(mobileAndroidAssociation().packageName, 'nl.salvemundi.android.acc');
        process.env.MOBILE_ANDROID_PACKAGE_NAME = 'evil package'; assert.equal(mobileAndroidAssociation(), null);
        process.env.MOBILE_ANDROID_PACKAGE_NAME = ''; process.env.MOBILE_API_ENABLED = 'false'; assert.equal(mobileAndroidAssociation(), null);
        process.env.MOBILE_API_ENABLED = 'true'; process.env.ENV_NAME = 'prod'; assert.equal(mobileAndroidAssociation(), null);
    } finally {
        for (const [key, value] of Object.entries(original)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    }
    // The proxy must let the asset links file through exactly like the Apple association file.
    const proxy = readFileSync(new URL('../../frontend/src/proxy.ts', import.meta.url), 'utf8');
    assert.match(proxy, /pathname === '\/\.well-known\/apple-app-site-association' \|\| pathname === '\/\.well-known\/assetlinks\.json'\) \{\n\s+if \(!mobileEnabled\(\)\)/);
    // The proxy and the route handlers share one gate.
    assert.match(proxy, /import \{ mobileEnabled \} from '@\/server\/mobile\/policy';/);
});

test('client platform header is a closed allowlist and device tokens are validated per platform', () => {
    const request = value => ({ headers: { get: name => (name === 'x-client-platform' ? value : null) } });
    assert.equal(mobileClientPlatform(request('android')), 'android');
    assert.equal(mobileClientPlatform(request(' Android ')), 'android');
    for (const value of [null, '', 'ios', 'iOS', 'web', 'android; drop']) assert.equal(mobileClientPlatform(request(value)), 'ios');
    const fcm = 'dGVzdC1pbnN0YW5jZQ:APA91bH' + 'Ab9_-'.repeat(28);
    assert.equal(validDeviceToken('ios', 'ab'.repeat(32)), true);
    assert.equal(validDeviceToken('ios', fcm), false);
    assert.equal(validDeviceToken('android', fcm), true);
    assert.equal(validDeviceToken('android', 'ab'.repeat(32)), false);
    assert.equal(validDeviceToken('android', fcm + '='), false);
});

test('login completion requires the flow nonce from the initiating browser', () => {
    const flow = newOpaqueCode(); const nonce = newOpaqueCode(); const hash = hashMobileToken(nonce);
    assert.equal(validBrowserFlowCookie(`${flow}.${nonce}`, flow, hash), true);
    assert.equal(validBrowserFlowCookie('', flow, hash), false);
    assert.equal(validBrowserFlowCookie(`${flow}.${newOpaqueCode()}`, flow, hash), false);
    assert.equal(validBrowserFlowCookie(`${newOpaqueCode()}.${nonce}`, flow, hash), false);
});

test('complete native auth flow against camelCase and snake_case session schemas', () => {
    const testFile = fileURLToPath(new URL('./mobile-auth-flow.test.mjs', import.meta.url));
    const result = spawnSync(process.execPath, ['--experimental-vm-modules', '--test', testFile], {
        encoding: 'utf8', timeout: 60000, maxBuffer: 2 * 1024 * 1024
    });
    assert.equal(result.status, 0, `${result.error?.message || ''}\n${result.stdout}\n${result.stderr}`);
});
