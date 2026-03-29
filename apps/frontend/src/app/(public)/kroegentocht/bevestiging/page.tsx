import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/layout/PageHeader';
import ConfirmationIsland from '@/components/islands/activities/ConfirmationIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

interface PageProps {
    searchParams: Promise<{ id?: string; transaction_id?: string }>;
}

export default async function KroegentochtConfirmationPage({ searchParams }: PageProps) {
    const { id, transaction_id } = await searchParams;

    if (!id && !transaction_id) notFound();

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
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-40 animate-pulse">
                        <div className="w-16 h-16 bg-[var(--theme-purple)]/10 rounded-full mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Kroegentocht gegevens verifiëren...</p>
                    </div>
                }>
                    <ConfirmationIsland 
                        initialId={id} 
                        initialTransactionId={transaction_id} 
                        isLoggedIn={!!session?.user} 
                    />
                </Suspense>
            </div>
        </main>
    );
}
