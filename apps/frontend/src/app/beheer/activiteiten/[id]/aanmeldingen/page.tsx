import { Suspense } from 'react';
import type { Metadata } from 'next';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ActiviteitAanmeldingenIsland from '@/components/islands/admin/activities/ActiviteitAanmeldingenIsland';
import AanmeldingenListSkeleton from '@/components/ui/admin/activities/AanmeldingenListSkeleton';
import { getSystemDirectus } from '@/lib/directus';
import { readItem, readItems } from '@directus/sdk';

export const metadata: Metadata = {
    title: 'Activiteit Aanmeldingen | SV Salve Mundi',
};

export default async function AanmeldingenPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    
    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={<AanmeldingenListSkeleton />}>
                <SignupsDataLoader id={resolvedParams.id} />
            </Suspense>
        </main>
    );
}

async function SignupsDataLoader({ id }: { id: string }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return <UnauthorizedAccess />;

    const user = session.user as any;
    const memberships = user.committees || [];
    const hasPriv = memberships.some((c: any) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
    });

    // Fetch Event
    let event;
    try {
        event = await getSystemDirectus().request(
            readItem<any, any, any>('events', id, {
                fields: ['id', 'name', 'price_members', 'committee_id']
            })
        );
    } catch (e) {
        return notFound();
    }

    if (!event) return notFound();

    // RBAC
    let hasAccess = hasPriv;
    if (!hasAccess && event.committee_id) {
        const isMember = memberships.some((c: any) => String(c.id) === String(event.committee_id));
        if (isMember) hasAccess = true;
    }

    if (!hasAccess) return <UnauthorizedAccess specific={true} />;

    // Fetch Signups
    let signups: any[] = [];
    try {
        signups = await getSystemDirectus().request(
            readItems<any, any, any>('event_signups', {
                filter: {
                    event_id: { _eq: id }
                },
                fields: [
                    'id', 
                    'participant_name', 
                    'participant_email', 
                    'participant_phone', 
                    'payment_status', 
                    'checked_in',
                    'checked_in_at'
                ],
                sort: ['-id'],
                limit: -1
            })
        );
    } catch (e: any) {
        console.error("Failed to fetch signups:", e.message, e?.errors || e);
    }

    return (
        <div className="pb-20">
            <ActiviteitAanmeldingenIsland event={event} initialSignups={signups} />
        </div>
    );
}

function UnauthorizedAccess({ specific = false }: { specific?: boolean }) {
    return (
        <div className="container mx-auto px-4 py-20 max-w-2xl">
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl p-12 text-center border border-[var(--beheer-border)]">
                <div className="mb-8 flex justify-center">
                    <div className="rounded-full bg-red-500/10 p-8 shadow-glow-red">
                        <ShieldAlert className="h-20 w-20 text-red-500" />
                    </div>
                </div>
                <h1 className="text-4xl font-black text-[var(--beheer-text)] uppercase tracking-tighter mb-4">Toegang Geweigerd</h1>
                <p className="text-xl text-[var(--beheer-text-muted)] font-medium mb-10 leading-relaxed">
                    {specific 
                        ? "Je hebt geen rechten om deze aanmeldingen te bekijken. Dit gedeelte is alleen voor organisatoren, bestuur of ICT."
                        : "Je hebt geen rechten om activiteiten te beheren."}
                </p>
                <div className="flex justify-center">
                    <Link 
                        href="/beheer/activiteiten" 
                        className="inline-flex items-center justify-center gap-3 bg-[var(--beheer-border)] text-[var(--beheer-text)] px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-[var(--beheer-accent)] hover:text-white transition-all active:scale-95 group"
                    >
                        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> 
                        <span>Ga Terug</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

