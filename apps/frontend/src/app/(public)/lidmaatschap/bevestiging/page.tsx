import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/layout/PageHeader';
import ConfirmationIsland from '@/components/islands/activities/ConfirmationIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

interface PageProps {
    searchParams: Promise<{ id?: string; transaction_id?: string; t?: string }>;
}

export default async function LidmaatschapConfirmationPage({ searchParams }: PageProps) {
    const { id, transaction_id, t } = await searchParams;

    if (!id && !transaction_id && !t) notFound();

    const session = await auth.api.getSession({
        headers: await headers()
    });

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <PageHeader 
                title="BEVESTIGING"
                backgroundImage="/img/backgrounds/Kroto2025.jpg"
                variant="centered"
                contentPadding="py-16"
            />
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
