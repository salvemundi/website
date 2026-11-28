import { beforeEach, describe, expect, it, vi } from 'vitest';

const getToken = vi.fn<() => Promise<{ token: string; expiresOnTimestamp: number }>>();
vi.mock('@azure/identity', () => ({
    OnBehalfOfCredential: class {
        constructor(readonly o: { userAssertionToken: string }) {}
        getToken() {
            return getToken().then((t) => ({ ...t, token: `${t.token}:${this.o.userAssertionToken}` }));
        }
    },
}));

const { AccessDeniedError, createOboExchanger, SourceUnavailableError } = await import('../src/graph/client.js');
const opts = { tenantId: 't', clientId: 'c', clientSecret: 's' };

beforeEach(() => getToken.mockReset());

describe('OBO-tokencache', () => {
    it('hergebruikt het Graph-token per gebruikerstoken tot kort voor vervallen, en nooit voor een ander token', async () => {
        let now = 0;
        getToken.mockImplementation(() => Promise.resolve({ token: `g${getToken.mock.calls.length}`, expiresOnTimestamp: 60 * 60 * 1000 }));
        const ex = createOboExchanger(opts, () => now);
        expect(await ex('user-a')).toBe('g1:user-a');
        expect(await ex('user-a')).toBe('g1:user-a');
        expect(await ex('user-b')).toBe('g2:user-b');
        expect(getToken).toHaveBeenCalledTimes(2);
        now = 59 * 60 * 1000; // binnen de marge van 2 minuten: vernieuwen
        expect(await ex('user-a')).toBe('g3:user-a');
    });
    it('cachet geen fouten en onderscheidt geweigerd van onbereikbaar', async () => {
        const ex = createOboExchanger(opts);
        getToken.mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'AuthenticationError' }));
        await expect(ex('u')).rejects.toBeInstanceOf(AccessDeniedError);
        getToken.mockRejectedValueOnce(new Error('net'));
        await expect(ex('u')).rejects.toBeInstanceOf(SourceUnavailableError);
        getToken.mockResolvedValueOnce({ token: 'ok', expiresOnTimestamp: Date.now() + 3600_000 });
        expect(await ex('u')).toBe('ok:u');
    });
});
