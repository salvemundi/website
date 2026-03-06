import React, { Suspense } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmationIsland from '@/components/islands/ConfirmationIsland';
import { Loader2 } from 'lucide-react';

export const metadata = {
    title: 'Bevestiging | Salve Mundi',
};

async function ConfirmationWrapper({ searchParams }: { searchParams: Promise<{ transaction_id?: string, type?: string }> }) {
    const params = await searchParams;
    const transactionId = params.transaction_id || null;
    const type = params.type || null;

    return (
        <div className="flex flex-col items-center justify-center p-6 sm:p-10 mb-20 animate-in fade-in duration-700">
            <ConfirmationIsland transactionId={transactionId} type={type} />
        </div>
    );
}

export default function ConfirmationPage({ searchParams }: { searchParams: Promise<{ transaction_id?: string, type?: string }> }) {
    return (
        <>
            <PageHeader
                title="BEVESTIGING"
                backgroundImage="/img/backgrounds/homepage-banner.jpg"
                contentPadding="py-20"
                imageFilter="brightness(0.65)"
            />

            <main className="max-w-app mx-auto min-h-[40vh]">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <Loader2 className="w-16 h-16 text-theme-purple animate-spin mb-4" />
                        <div className="h-4 w-32 bg-purple-100 rounded" />
                    </div>
                }>
                    <ConfirmationWrapper searchParams={searchParams} />
                </Suspense>
            </main>
        </>
    );
}
