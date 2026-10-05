import SignupForm from '@/components/islands/beheer/kroegentocht/SignupForm';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import { getPubCrawlSignup, getPubCrawlEvent } from '@/server/actions/beheer/kroegentocht/beheer-kroegentocht-core.actions';
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
    const signupId = parseInt(id);
    const signup = await getPubCrawlSignup(signupId).catch(() => null);

    if (!signup) notFound();

    const eventId = typeof signup.pub_crawl_event_id === 'object'
        ? Number(signup.pub_crawl_event_id.id)
        : Number(signup.pub_crawl_event_id);
    const event = await getPubCrawlEvent(eventId).catch(() => null);
    const rawGroups: unknown = event?.groups;
    const eventGroups = Array.isArray(rawGroups)
        ? rawGroups.map((g: unknown): string => {
            if (typeof g === 'string') return g;
            if (g && typeof g === 'object' && 'name' in g) {
                const nameVal = (g as { name?: unknown }).name;
                return typeof nameVal === 'string' ? nameVal : '';
            }
            return '';
        }).filter(Boolean)
        : [];

    return (
        <BeheerPageShell
            title="Deelnemer Beheer"
            subtitle={`Inschrijving van ${signup.name}`}
            backHref="/beheer/kroegentocht"
        >
            <SignupForm signup={signup} eventGroups={eventGroups} />
        </BeheerPageShell>
    );
}
