import { Container, Stack, Text, Title } from '@mantine/core';
import { getPubCrawlScanner } from '@/server/actions/events/kroegentocht/kroegentocht-scanner.actions';
import KroegentochtScannerIsland from '@/components/islands/kroegentocht/KroegentochtScannerIsland';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kroegentocht tickets scannen', robots: { index: false, follow: false } };

export default async function ScannerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const eventId = Number(id);
    const scanner = await getPubCrawlScanner(eventId);
    if (scanner) return <KroegentochtScannerIsland eventId={eventId} eventName={scanner.name || 'Kroegentocht'} groups={scanner.groups} />;
    return (
        <Container size="sm" py="xl">
            <Stack gap="md">
                <Title order={1} size="h2">Kroegentocht tickets scannen</Title>
                <Text c="dimmed">De scanner is momenteel niet actief. Vraag de organisatie om deze te activeren.</Text>
            </Stack>
        </Container>
    );
}
