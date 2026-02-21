'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function Handler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const status = searchParams.get('payment_status');
        const eventId = searchParams.get('event_id');

        if (status === 'success' && eventId) {
            router.replace(`/activiteiten/${eventId}`);
        }
    }, [searchParams, router]);

    return null;
}

export function PaymentStatusHandler() {
    return (
        <Suspense fallback={null}>
            <Handler />
        </Suspense>
    );
}
