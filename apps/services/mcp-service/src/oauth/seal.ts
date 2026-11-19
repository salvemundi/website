import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

/**
 * Stateless, versleutelde en geauthenticeerde tokens (AES-256-GCM) voor de OAuth-voorportaalflow.
 * De sleutel wordt afgeleid van het Entra client secret; er is geen extra geheim of opslag nodig.
 * `purpose` is aanvullende geauthenticeerde data: een client_id kan dus nooit als state of code worden gebruikt.
 */
export interface Sealer {
    seal(purpose: string, data: object): string;
    open<T extends object>(purpose: string, token: string): T | null;
}

export function createSealer(secret: string): Sealer {
    const key = Buffer.from(hkdfSync('sha256', secret, 'salvemundi-mcp', 'oauth-proxy-v1', 32));
    return {
        seal(purpose, data) {
            const iv = randomBytes(12);
            const cipher = createCipheriv('aes-256-gcm', key, iv);
            cipher.setAAD(Buffer.from(purpose));
            const body = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
            return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
        },
        open<T extends object>(purpose: string, token: string): T | null {
            try {
                const raw = Buffer.from(token, 'base64url');
                if (raw.length < 29) return null;
                const decipher = createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
                decipher.setAAD(Buffer.from(purpose));
                decipher.setAuthTag(raw.subarray(12, 28));
                const plain = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
                return JSON.parse(plain) as T;
            } catch {
                return null;
            }
        },
    };
}
