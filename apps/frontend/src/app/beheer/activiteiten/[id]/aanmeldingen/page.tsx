import type { Metadata } from 'next';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ActiviteitAanmeldingenIsland, { type Signup, type AdminEvent } from '@/components/islands/admin/activities/ActiviteitAanmeldingenIsland';
import {
    getActivityByIdInternal,
    getActivitySignupsInternal
} from '@/server/queries/activiteiten/admin-activiteiten.queries';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { type EnrichedUser } from '@/types/auth';

export const metadata: Metadata = {
    title: 'Activiteit Aanmeldingen | SV Salve Mundi'
};

export default async function AanmeldingenPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const session = await getEnrichedSession();
    if (!session) return <AdminUnauthorized title="Activiteit Aanmeldingen" />;

    const user = session.user as unknown as EnrichedUser;
    const hasAccess = !!user.permissions?.includes('activiteiten');

    const eventData = await getActivityByIdInternal(id);

    if (!eventData) return notFound();

    if (!hasAccess) {
        return (
            <AdminUnauthorized
                title="Activiteit Aanmeldingen"
                description="Je hebt geen rechten om deze aanmeldingen te bekijken. Dit gedeelte is alleen voor commissieleden, bestuur of ICT."
            />
        );
    }

    const event: AdminEvent = {
        id: eventData.id,
        name: eventData.name,
        price_members: Number(eventData.price_members),
        max_sign_ups: eventData.max_sign_ups
    };

    const dbSignups = await getActivitySignupsInternal(id);

    const signups: Signup[] = dbSignups.map(s => ({
        id: s.id,
        participant_name: s.participant_name || 'Onbekend',
        participant_email: s.participant_email || '-',
        participant_phone: s.participant_phone,
        payment_status: s.payment_status || 'open',
        created_at: s.created_at || new Date().toISOString(),
        checked_in: !!s.checked_in,
        is_member: !!s.is_member,
        directus_relations: s.directus_relations as unknown as Signup['directus_relations']
    }));

    const totalSignups = signups.length;
    const checkedInCount = signups.filter(s => s.checked_in).length;
    const spotsLeft = event.max_sign_ups ? event.max_sign_ups - totalSignups : null;

    return (
        <AdminPageShell
            title="Aanmeldingen"
            subtitle={`Lijst van deelnemers voor "${event.name}"`}
            backHref={`/beheer/activiteiten`}
            actions={
                <div className="flex items-center gap-4">
                    <Link href={`/beheer/activiteiten/${id}/scanner`} className="hidden md:inline-block">
                        <button className="beheer-button h-10 px-4 rounded-xl bg-theme-purple text-white font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-theme-purple/20 text-sm">
                            Scanner
                        </button>
                    </Link>
                    <div className="hidden md:flex items-center gap-4 bg-bg-soft px-4 py-2 rounded-2xl border border-border-color/50 shadow-sm">
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Totaal</span>
                            <span className="text-sm font-bold text-text-main leading-none">{totalSignups}</span>
                        </div>
                        <div className="w-px h-6 bg-border-color/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Ingecheckt</span>
                            <span className="text-sm font-bold text-beheer-active leading-none">{checkedInCount}</span>
                        </div>
                        {spotsLeft !== null && (
                            <>
                                <div className="w-px h-6 bg-border-color/20" />
                                <div className="flex flex-col items-center px-2">
                                    <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Plekken over</span>
                                    <span className="text-sm font-bold text-text-main leading-none">{spotsLeft}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <div className="pb-20">
                <ActiviteitAanmeldingenIsland
                    event={event}
                    initialSignups={signups}
                    canAccessEdit={!!user.permissions?.includes('activiteiten:edit')}
                />
            </div>
        </AdminPageShell>
    );
}