import { getPubCrawlEventsAction, getKroegentochtSettingsAction } from '@/shared/api/kroegentocht-actions';
import KroegentochtClient from './KroegentochtClient';

export default async function KroegentochtPage() {
    const events = await getPubCrawlEventsAction();
    const settings = await getKroegentochtSettingsAction();

    return <KroegentochtClient initialEvents={events} initialSettings={settings} />;
}
