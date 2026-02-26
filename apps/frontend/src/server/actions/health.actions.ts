'use server';

export type ServiceStatusResult = {
    name: string;
    url: string;
    isOnline: boolean;
    status: number | null;
    error: string | null;
};

export async function checkServiceStatus(url: string, serviceName: string): Promise<ServiceStatusResult> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout

        const res = await fetch(url, {
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeoutId);

        return {
            name: serviceName,
            url,
            isOnline: res.ok || res.status === 404 || res.status === 401 || res.status === 403,
            status: res.status,
            error: null
        };
    } catch (error: any) {
        return {
            name: serviceName,
            url,
            isOnline: false,
            status: null,
            error: error.name === 'AbortError' ? 'Timeout' : error.message
        };
    }
}

export async function getHealthStatuses() {
    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
    const financeUrl = process.env.INTERNAL_FINANCE_URL || 'http://localhost:3001';

    const [directusStatus, financeStatus] = await Promise.all([
        checkServiceStatus(`${directusUrl}/server/ping`, 'Directus'),
        checkServiceStatus(`${financeUrl}/ping`, 'Finance Service')
    ]);

    return [directusStatus, financeStatus];
}
