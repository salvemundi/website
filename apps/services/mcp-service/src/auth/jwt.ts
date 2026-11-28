import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export class AuthError extends Error {
    constructor(public readonly status: 401 | 403, public readonly code: 'invalid_token' | 'insufficient_scope' | 'forbidden') {
        super(code);
    }
}

export interface VerifierOptions {
    tenantId: string;
    audience: string[];
    requiredScope: string;
    /** Alleen voor tests; productie gebruikt het JWKS van de tenant. */
    keyResolver?: JWTVerifyGetKey;
}

/** `key` = stabiele, per-gebruiker cache-sleutel (tid:oid). `token` = het gevalideerde gebruikerstoken voor de OBO-uitwisseling. */
export interface UserContext { key: string; token: string; scopes: string[] }

export interface TokenVerifier {
    verify(token: string): Promise<UserContext>;
}

export function createVerifier(opts: VerifierOptions): TokenVerifier {
    const issuer = `https://login.microsoftonline.com/${opts.tenantId}/v2.0`;
    const keys =
        opts.keyResolver ??
        createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${opts.tenantId}/discovery/v2.0/keys`), {
            timeoutDuration: 5000,
            cooldownDuration: 30000,
        });

    return {
        async verify(token) {
            let payload;
            try {
                ({ payload } = await jwtVerify(token, keys, {
                    issuer,
                    audience: opts.audience,
                    algorithms: ['RS256'],
                    requiredClaims: ['exp', 'sub', 'tid', 'oid'],
                    clockTolerance: 30,
                }));
            } catch {
                throw new AuthError(401, 'invalid_token');
            }
            // Alleen leden van de eigen tenant. Gasten (B2B) krijgen een token met dezelfde issuer, maar met een `idp` van hun
            // eigen tenant/provider; `acct` (optionele claim) is 1 voor gasten. Zo hangt "alleen leden" niet alleen af van de
            // gebruikerstoewijzing in Entra.
            if (payload.tid !== opts.tenantId) throw new AuthError(401, 'invalid_token');
            const ownIdp = [`https://sts.windows.net/${opts.tenantId}/`, `https://login.microsoftonline.com/${opts.tenantId}/v2.0`];
            if (payload.idp !== undefined && (typeof payload.idp !== 'string' || !ownIdp.includes(payload.idp))) throw new AuthError(403, 'forbidden');
            if (payload.acct !== undefined && payload.acct !== 0) throw new AuthError(403, 'forbidden');
            // Alleen gedelegeerde tokens (scp): de Graph-toegang loopt via On-Behalf-Of en vereist een aangemelde gebruiker.
            const scopes = typeof payload.scp === 'string' ? payload.scp.split(' ') : [];
            if (!scopes.includes(opts.requiredScope)) throw new AuthError(403, 'insufficient_scope');
            const user = String(payload.oid);
            return { key: `${opts.tenantId}:${user}`, token, scopes };
        },
    };
}
