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

        socket.once('error', (err) => {
            socket.destroy();
            resolve({ name, target: `${host}:${port}`, isOnline: false, status: null, error: err.message });
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

        return {
            name: serviceName,
            target: url,
            isOnline: res.ok || res.status < 500,
            status: res.status,
            error: null
        };
    } catch (error: any) {
        return {
            name: serviceName,
            target: url,
            isOnline: false,
            status: null,
            error: error.name === 'AbortError' ? 'Timeout (> 5s)' : error.message
        };
    }
}

export async function getHealthStatuses() {
    // Core Infra
    const directusUrl = process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';

    // Services
    const financeUrl = process.env.INTERNAL_FINANCE_URL || 'http://finance-service:3001';
    const syncUrl = process.env.INTERNAL_SYNC_URL || 'http://sync-service:3002';
    const mailUrl = process.env.INTERNAL_MAIL_URL || 'http://mail-service:3003';

    const results = await Promise.all([
        // Shared Core Stack
        checkServiceStatus(`${directusUrl}/server/ping`, 'Core: Directus'),
        checkPort('v7-core-db', 5432, 'Core: Database (Postgres)'),
        checkPort('v7-core-redis', 6379, 'Core: Cache (Redis)'),

        // Application Stack
        checkServiceStatus(`${financeUrl}/health`, 'App: Finance Service'),
        checkServiceStatus(`${syncUrl}/health`, 'App: Sync Service'),
        checkServiceStatus(`${mailUrl}/health`, 'App: Mail Service')
    ]);

    return results;
}
