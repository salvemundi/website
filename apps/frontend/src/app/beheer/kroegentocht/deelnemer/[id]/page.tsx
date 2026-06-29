'use server';

import SignupForm from '@/components/islands/admin/kroegentocht/SignupForm';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { getPubCrawlSignup, getPubCrawlEvent } from '@/server/actions/admin/admin-kroegentocht.actions';
import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';

export async function generateMetadata({ params: _params }: { params: Promise<{ id: string }> }) {
    return {
        title: `Kroegentocht Deelnemer Beheer | Salve Mundi`
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

    // Fetch event details to get the groups configuration
    const event = await getPubCrawlEvent(Number(signup.pub_crawl_event_id.id)).catch(() => null);
    const rawGroups = (event?.groups || []) as unknown[];
    const eventGroups = Array.isArray(rawGroups)
        ? rawGroups.map((g: unknown): string => {
            if (typeof g === 'string') return g;
            const obj = g && typeof g === 'object' ? (g as { name?: unknown }) : {};
            return typeof obj.name === 'string' ? obj.name : '';
        }).filter(Boolean)
        : [];

    return (
        <AdminPageShell
            title="Deelnemer Beheer"
            subtitle={`Inschrijving van ${signup.name}`}
            backHref="/beheer/kroegentocht"
        >
            <SignupForm signup={signup} eventGroups={eventGroups} />
        </AdminPageShell>
    );
}
