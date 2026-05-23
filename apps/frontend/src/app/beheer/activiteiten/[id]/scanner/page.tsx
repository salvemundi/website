import type { Metadata } from 'next';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { notFound } from 'next/navigation';
import {
    getActivityByIdInternal,
    getActivitySignupsInternal
} from '@/server/queries/admin-event.queries';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AttendanceIsland from '@/components/islands/activities/AttendanceIsland';
import { safeConsoleError } from '@/server/utils/logger';

export const metadata: Metadata = {
    title: 'Scanner | SV Salve Mundi'
};

export default async function ScannerPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const session = await getEnrichedSession();
    if (!session) return <AdminUnauthorized title="Activiteit Scanner" />;

    const user = session.user;
    const hasAccess = !!user.canAccessActivitiesView;

    try {
        const eventData = await getActivityByIdInternal(id);
        if (!eventData) return notFound();

        if (!hasAccess) {
            return (
                <AdminUnauthorized
                    title="Activiteit Scanner"
                    description="Je hebt geen rechten om deze scanner te gebruiken."
                />
            );
        }

        const dbSignups = await getActivitySignupsInternal(id);

        const initialSignups = dbSignups.map(s => ({
            id: s.id || 0,
            participant_name: s.participant_name || 'Onbekend',
            participant_email: s.participant_email || '-',
            checked_in: !!s.checked_in,
            qr_token: s.qr_token || undefined,
            checked_in_at: s.checked_in_at || null
        }));

        return (
            <AdminPageShell
                title="Scanner"
                subtitle={`Scanner voor: "${eventData.titel}"`}
                backHref={`/beheer/activiteiten/${id}/aanmeldingen`}
            >
                <div className="pb-20">
                    <AttendanceIsland eventId={String(id)} eventName={eventData.titel} initialSignups={initialSignups} />
                </div>
            </AdminPageShell>
        );
    } catch (error) {
        safeConsoleError('[ScannerPage][page]', error);
        return notFound();
    }
}