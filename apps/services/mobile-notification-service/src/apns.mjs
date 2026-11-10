import { connect } from 'node:http2';
import { createPrivateKey, sign } from 'node:crypto';

let cachedJWT;
export function providerToken(env, now = Date.now()) {
    if (cachedJWT && cachedJWT.keyID === env.APNS_KEY_ID && cachedJWT.teamID === env.APNS_TEAM_ID && cachedJWT.createdAt > now - 50 * 60 * 1000) return cachedJWT.value;
    if (!env.APNS_KEY_ID || !env.APNS_TEAM_ID || !env.APNS_PRIVATE_KEY || !env.APNS_TOPIC) throw new Error('APNS_CONFIGURATION_MISSING');
    const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: env.APNS_KEY_ID })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ iss: env.APNS_TEAM_ID, iat: Math.floor(now / 1000) })).toString('base64url');
    const input = `${header}.${payload}`;
    const key = createPrivateKey(env.APNS_PRIVATE_KEY.replace(/\\n/g, '\n'));
    const signature = sign('sha256', Buffer.from(input), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
    cachedJWT = { keyID: env.APNS_KEY_ID, teamID: env.APNS_TEAM_ID, createdAt: now, value: `${input}.${signature}` };
    return cachedJWT.value;
}
export async function sendAPNs(device, payload, collapseID, env) {
    const jwt = providerToken(env);
    const host = device.apns_environment === 'production' ? 'https://api.push.apple.com' : 'https://api.sandbox.push.apple.com';
    return new Promise((resolve, reject) => {
        const client = connect(host);
        let settled = false;
        const finish = (error, result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            client.destroy();
            if (error) reject(error); else resolve(result);
        };
        const timer = setTimeout(() => finish(new Error('APNS_TIMEOUT')), 10000);
        client.on('error', () => finish(new Error('APNS_CONNECTION_FAILED')));
        const request = client.request({
            ':method': 'POST', ':path': `/3/device/${device.token}`,
            authorization: `bearer ${jwt}`, 'apns-topic': env.APNS_TOPIC,
            'apns-push-type': 'alert', 'apns-priority': '10',
            'apns-expiration': `${Math.floor(Date.now() / 1000) + 60 * 60}`,
            'apns-collapse-id': collapseID.slice(0, 64), 'content-type': 'application/json'
        });
        let status = 0;
        let body = '';
        request.on('response', headers => { status = Number(headers[':status']); });
        request.setEncoding('utf8');
        request.on('data', chunk => { if (body.length < 4096) body += chunk; });
        request.on('error', () => finish(new Error('APNS_REQUEST_FAILED')));
        request.on('end', () => {
            let reason;
            try { reason = JSON.parse(body).reason; } catch { /* APNs success has no body. */ }
            finish(null, { status, reason });
        });
        request.end(JSON.stringify(payload));
    });
}
