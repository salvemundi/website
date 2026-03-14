import { createMollieClient, MollieClient } from '@mollie/api-client';

let _mollieClient: MollieClient | null = null;

export function getMollieClient(): MollieClient {
    if (_mollieClient) return _mollieClient;

    const apiKey = process.env.MOLLIE_API_KEY;
    if (!apiKey) {
        throw new Error('Missing MOLLIE_API_KEY in environment variables');
    }

    _mollieClient = createMollieClient({ apiKey });
    return _mollieClient;
}
