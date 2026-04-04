import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaymentStatusIsland from '@/components/islands/activities/PaymentStatusIsland';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Bevestiging Betaling | SV Salve Mundi',
};

interface PageProps {
    searchParams: Promise<{ id?: string; t?: string }>;
}

export default async function TripConfirmationPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const token = params.t; 

    if (!token) {
        return (
            <main className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6">
                <div className="max-w-md w-full p-12 bg-white/5 border border-white/5 rounded-3xl text-center">
                    <h1 className="text-2xl font-black text-white uppercase italic mb-4">Ongeldige Status</h1>
                    <p className="text-gray-400 mb-8">We kunnen de status van je betaling niet verifiëren zonder een geldige transactie- of token-ID.</p>
                    <a href="/reis" className="inline-block px-8 py-4 bg-white text-black font-bold rounded-2xl">
                        Terug naar Reizen
                    </a>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <div className="container mx-auto px-4 py-32 max-w-2xl">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Status voorbereiden...</p>
                    </div>
                }>
                    <PaymentStatusIsland mollieId={token} />
                </Suspense>
            </div>
        </main>
    );
}
