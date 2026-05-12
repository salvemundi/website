'use server';

import { Socket } from 'net';

export type ServiceStatusResult = {
    name: string;
    target: string;
    isOnline: boolean;
    status: string | number | null;
    error: string | null;
};

async function checkPort(host: string, port: number, name: string): Promise<ServiceStatusResult> {
    return new Promise((resolve) => {
        const socket = new Socket();
        const timeout = 2000;

        socket.setTimeout(timeout);
        socket.once('connect', () => {
            socket.destroy();
            resolve({ name, target: `${host}:${port}`, isOnline: true, status: 'Connected', error: null });
        });

        socket.once('timeout', () => {
            socket.destroy();
            resolve({ name, target: `${host}:${port}`, isOnline: false, status: null, error: 'Timeout' });
        });

        socket.once('error', (error) => {
            socket.destroy();
            resolve({ name, target: `${host}:${port}`, isOnline: false, status: null, error: error.message });
        });

        socket.connect(port, host);
    });
}

export async function checkServiceStatus(url: string, serviceName: string): Promise<ServiceStatusResult> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timeoutId);

        const isOk = res.ok || res.status < 500;
        await res.text();

        return {
            name: serviceName,
            target: url,
            isOnline: isOk,
            status: res.status,
            error: null
        };
    } catch (error) {
        const parsedError = error instanceof Error ? error : new Error(String(error));
        const isTimeout = parsedError.name === 'TimeoutError' || parsedError.name === 'AbortError';

        // Geef netjes een offline status terug in plaats van de pagina te laten crashen
        return {
            name: serviceName,
            target: url,
            isOnline: false,
            status: null,
            error: isTimeout ? 'Timeout (Service unreachable)' : parsedError.message
        };
    }
}

export async function getHealthStatuses(): Promise<ServiceStatusResult[]> {
    const directusUrl = process.env.DIRECTUS_SERVICE_URL!;
    const financeUrl = process.env.FINANCE_SERVICE_URL!;
    const syncUrl = process.env.AZURE_SYNC_SERVICE_URL!;
    const mailUrl = process.env.MAIL_SERVICE_URL!;

    const results = await Promise.all([
        checkServiceStatus(`${directusUrl}/server/ping`, 'Core: Directus'),
        checkPort(process.env.INTERNAL_DB_HOST!, 5432, 'Core: Database (Postgres)'),
        checkPort(process.env.INTERNAL_REDIS_HOST!, 6379, 'Core: Cache (Redis)'),
        checkServiceStatus(`${financeUrl}/health`, 'App: Finance Service'),
        checkServiceStatus(`${syncUrl}/health`, 'App: Sync Service'),
        checkServiceStatus(`${mailUrl}/health`, 'App: Mail Service')
    ]);

    return results;
}