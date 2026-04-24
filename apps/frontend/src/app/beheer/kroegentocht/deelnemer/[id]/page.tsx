'use server';

import SignupForm from '@/components/admin/kroegentocht/SignupForm';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import { getPubCrawlSignup } from '@/server/actions/admin-kroegentocht.actions';
import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    return {
        title: `Kroegentocht Deelnemer Beheer | Salve Mundi`,
    };
}

interface DeelnemerPageProps {
    params: Promise<{ id: string }>;
}

export default async function DeelnemerPage({ params }: DeelnemerPageProps) {
    noStore();
    const { id } = await params;
    
    // Fetch signup data (including tickets)
    const signupId = parseInt(id);
    const signup = await getPubCrawlSignup(signupId).catch(() => null);

    if (!signup) notFound();

    return (
        <div className="w-full">
            <AdminToolbar 
                title="Deelnemer Beheer"
                subtitle={`Groep #${id}`}
                backHref="/beheer/kroegentocht"
            />

            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <SignupForm signup={signup} />
            </div>
        </div>
    );
}
