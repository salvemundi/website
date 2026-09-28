import { unstable_noStore as noStore } from 'next/cache';
import { getPubCrawlEvents, getKroegentochtSettings, getPubCrawlSignups } from '@/server/actions/beheer/kroegentocht/beheer-kroegentocht-core.actions';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import KroegentochtManagementIsland from '@/components/islands/beheer/KroegentochtManagementIsland';

export const metadata = {
    title: 'Kroegentocht Beheer | Salve Mundi',
    description: 'Beheer aanmeldingen en instellingen voor de Kroegentocht.' 
};

export default async function KroegentochtPage() {
    noStore();

    const [events, settings] = await Promise.all([
        getPubCrawlEvents().catch(() => []),
        getKroegentochtSettings().catch(() => ({ show: true }))
    ]);

    const initialEvent = (events.find(e => e.date && new Date(e.date) >= new Date()) || events[0]) as typeof events[0] | undefined;
    const initialSignups = initialEvent ? await getPubCrawlSignups(Number(initialEvent.id)).catch(() => []) : [];

    return (
        <BeheerPageShell
            title="Kroegentocht Beheer"
            backHref="/beheer"
            hideToolbar={true}
        >
            <KroegentochtManagementIsland 
                initialEvents={events} 
                initialSettings={settings} 
                initialSignups={initialSignups}
            />
        </BeheerPageShell>
    );
}

