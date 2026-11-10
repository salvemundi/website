import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { verifyPKCE, validChallenge, hashMobileToken, newMobileToken, isNativeToken, MOBILE_CALLBACK, newOpaqueCode, validBrowserFlowCookie } from '../apps/frontend/src/server/mobile/security.ts';
import { mobileEnabled, mobileAssociationID } from '../apps/frontend/src/server/mobile/policy.ts';

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

test('login completion requires the flow nonce from the initiating browser', () => {
    const flow = newOpaqueCode(); const nonce = newOpaqueCode(); const hash = hashMobileToken(nonce);
    assert.equal(validBrowserFlowCookie(`${flow}.${nonce}`, flow, hash), true);
    assert.equal(validBrowserFlowCookie('', flow, hash), false);
    assert.equal(validBrowserFlowCookie(`${flow}.${newOpaqueCode()}`, flow, hash), false);
    assert.equal(validBrowserFlowCookie(`${newOpaqueCode()}.${nonce}`, flow, hash), false);
});
