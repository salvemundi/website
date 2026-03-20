'use server';

import SignupForm from '@/components/admin/kroegentocht/SignupForm';
import { User } from 'lucide-react';
import { getPubCrawlSignup } from '@/server/actions/admin-kroegentocht.actions';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    return {
        title: `Kroegentocht Deelnemer Beheer | Salve Mundi`,
    };
}

interface DeelnemerPageProps {
    params: Promise<{ id: string }>;
}

export default async function DeelnemerPage({ params }: DeelnemerPageProps) {
    const { id } = await params;
    
    // Fetch signup data (including tickets)
    const signupId = parseInt(id);
    const signup = await getPubCrawlSignup(signupId).catch(() => null);

    if (!signup) notFound();

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] mb-12">
                <div className="container mx-auto px-4 py-12 max-w-7xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-[var(--radius-xl)] bg-[var(--theme-purple)]/10 text-[var(--theme-purple)]">
                            <User className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-widest uppercase">
                            Deelnemer <span className="text-[var(--theme-purple)]">Beheer</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-20">
                <SignupForm signup={signup} />
            </div>
        </main>
    );
}
