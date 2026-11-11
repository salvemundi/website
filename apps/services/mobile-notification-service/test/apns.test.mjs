import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { providerToken } from '../src/apns.mjs';

test('APNs provider token uses valid ES256 P1363 signature, claims and caching', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const env = { APNS_KEY_ID: 'TESTKEY123', APNS_TEAM_ID: 'TESTTEAM12', APNS_TOPIC: 'nl.salvemundi.ios', APNS_PRIVATE_KEY: privateKey.export({ type: 'pkcs8', format: 'pem' }) };
    const now = Date.parse('2026-11-10T12:00Z');
    const token = providerToken(env, now);
    const [header, claims, signature] = token.split('.');
    assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url')), { alg: 'ES256', kid: env.APNS_KEY_ID });
    assert.deepEqual(JSON.parse(Buffer.from(claims, 'base64url')), { iss: env.APNS_TEAM_ID, iat: now / 1000 });
    assert.equal(verify('sha256', Buffer.from(`${header}.${claims}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(signature, 'base64url')), true);
    assert.equal(providerToken(env, now + 1000), token);
    assert.notEqual(providerToken(env, now + 51 * 60_000), token);
});

test('APNs PEM can contain literal escaped newline characters from environment injection', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
    const env = { APNS_KEY_ID: 'ESCAPED123', APNS_TEAM_ID: 'TESTTEAM12', APNS_TOPIC: 'nl.salvemundi.ios', APNS_PRIVATE_KEY: pem.replace(/\n/g, '\\n') };
    assert.equal(env.APNS_PRIVATE_KEY.includes(String.fromCharCode(92) + "n"), true);
    assert.equal(env.APNS_PRIVATE_KEY.includes(String.fromCharCode(10)), false);
    const token = providerToken(env, Date.parse('2026-11-10T13:00Z'));
    const [header, claims, signature] = token.split('.');
    assert.equal(verify('sha256', Buffer.from(`${header}.${claims}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(signature, 'base64url')), true);
});
