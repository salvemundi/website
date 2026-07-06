import { unstable_noStore as noStore } from 'next/cache';
import { getPubCrawlEvents, getKroegentochtSettings, getPubCrawlSignups } from '@/server/actions/admin/kroegentocht/admin-kroegentocht-core.actions';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPermissions } from '@/shared/lib/permissions';
import { redirect } from 'next/navigation';
import KroegentochtManagementIsland from '@/components/islands/admin/KroegentochtManagementIsland';

export const metadata = {
    title: 'Kroegentocht Beheer | Salve Mundi',
    description: 'Beheer aanmeldingen en instellingen voor de Kroegentocht.' };

export default async function KroegentochtPage() {
    noStore();
    const session = await getEnrichedSession();
    if (!session?.user) redirect('/?needLogin=true');
    const permissions = getPermissions(session.user.committees);
    if (!permissions.includes('kroegentocht')) {
        return <AdminUnauthorized title="Kroegentocht Beheer" backHref="/beheer" />;
    }

    const [events, settings] = await Promise.all([
        getPubCrawlEvents().catch(() => []),
        getKroegentochtSettings().catch(() => ({ show: true }))
    ]);

    const initialEvent = (events.find(e => e.date && new Date(e.date) >= new Date()) || events[0]) as typeof events[0] | undefined;
    const initialSignups = initialEvent ? await getPubCrawlSignups(Number(initialEvent.id)).catch(() => []) : [];

    return (
        <AdminPageShell
            title="Kroegentocht Beheer"
            subtitle="Beheer aanmeldingen, tickets en event instellingen"
            backHref="/beheer"
            hideToolbar={true}
        >
            <KroegentochtManagementIsland 
                initialEvents={events} 
                initialSettings={settings} 
                initialSignups={initialSignups}
            />
        </AdminPageShell>
    );
}

