import { getPubCrawlScanner } from '@/server/actions/events/kroegentocht/kroegentocht-scanner.actions';
import KroegentochtScannerIsland from '@/components/islands/kroegentocht/KroegentochtScannerIsland';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kroegentocht tickets scannen', robots: { index: false, follow: false } };

export default async function ScannerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const eventId = Number(id);
    const scanner = await getPubCrawlScanner(eventId);
    if (scanner) return <KroegentochtScannerIsland eventId={eventId} eventName={scanner.name || 'Kroegentocht'} groups={scanner.groups} />;
    return <div className="mx-auto max-w-xl space-y-6 px-4 py-12">
        <h1 className="text-2xl font-bold">Kroegentocht tickets scannen</h1>
        <p>De scanner is momenteel niet actief. Vraag de organisatie om deze te activeren.</p>
    </div>;
}
