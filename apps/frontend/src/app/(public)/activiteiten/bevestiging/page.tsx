import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ConfirmationIsland from '@/components/islands/activities/ConfirmationIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

interface PageProps {
    searchParams: Promise<{ id?: string; transaction_id?: string; t?: string }>;
}

export default async function ActiviteitenConfirmationPage({ searchParams }: PageProps) {
    const { id, transaction_id, t } = await searchParams;

    if (!id && !transaction_id && !t) notFound();

    const session = await auth.api.getSession({
        headers: await headers()
    });

    return (
        <main className="min-h-screen bg-[var(--bg-main)] pt-8">
            <h1 className="sr-only">Bevestiging</h1>
            <div className="container mx-auto px-4 max-w-7xl">
                <Suspense fallback={<ConfirmationIsland isLoading={true} />}>
                    <ConfirmationIsland 
                        initialId={id} 
                        initialTransactionId={transaction_id || t} 
                        isLoggedIn={!!session?.user} 
                    />
                </Suspense>
            </div>
        </main>
    );
}
