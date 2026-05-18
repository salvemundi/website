import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import { unstable_noStore as noStore } from 'next/cache';
import { getPubCrawlEvents, getKroegentochtSettings, getPubCrawlSignups } from '@/server/actions/admin/admin-kroegentocht.actions';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import KroegentochtManagementIsland from '@/components/islands/admin/KroegentochtManagementIsland';

export const metadata = {
    title: 'Kroegentocht Beheer | Salve Mundi',
    description: 'Beheer aanmeldingen en instellingen voor de Kroegentocht.' };

export default async function KroegentochtPage() {
    const { user: _user } = await checkAdminAccess(); // Ensure authorized
    noStore();

    // NUCLEAR SSR: Fetch events, settings and initial signups at the top level
    const [events, settings] = await Promise.all([
        getPubCrawlEvents().catch(() => []),
        getKroegentochtSettings().catch(() => ({ show: true }))
    ]);

    // Pre-fetch signups for the primary event (first future or first overall)
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

