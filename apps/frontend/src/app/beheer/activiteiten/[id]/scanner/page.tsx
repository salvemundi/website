import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import BeheerUnauthorized from '@/components/ui/beheer/BeheerUnauthorized';
import { notFound } from 'next/navigation';
import {
    getActivityByIdInternal,
    getActivitySignupsInternal
} from '@/server/queries/activiteiten/beheer-activiteiten.queries';
import AttendanceIsland from '@/components/islands/activiteiten/AttendanceIsland';
import { safeConsoleError } from '@/server/utils/logger';

export const metadata: Metadata = {
    title: 'Scanner | SV Salve Mundi'
};

interface ScannerSignup {
    id: number;
    participant_name: string;
    participant_email: string;
    checked_in: boolean;
    qr_token?: string;
    checked_in_at: string | null;
}

export default async function ScannerPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const session = await getEnrichedSession();
    if (!session) return <BeheerUnauthorized title="Activiteit Scanner" />;

    const user = session.user;
    const hasAccess = !!user.permissions?.includes('activiteiten');

    let eventData: Awaited<ReturnType<typeof getActivityByIdInternal>> | null = null;
    let initialSignups: ScannerSignup[] = [];

    try {
        eventData = await getActivityByIdInternal(id);

        if (eventData) {
            const dbSignups = await getActivitySignupsInternal(id) as unknown as Array<{
                id?: number | null;
                participant_name?: string | null;
                participant_email?: string | null;
                checked_in?: boolean | null;
                qr_token?: string | null;
                checked_in_at?: string | null;
            }>;

            initialSignups = dbSignups.map(s => ({
                id: s.id || 0,
                participant_name: s.participant_name || 'Onbekend',
                participant_email: s.participant_email || '-',
                checked_in: !!s.checked_in,
                qr_token: s.qr_token || undefined,
                checked_in_at: s.checked_in_at || null
            }));
        }
    } catch (error) {
        safeConsoleError('[page.tsx][ScannerPage] ', error);
        return notFound();
    }

    if (!eventData) return notFound();

    if (!hasAccess) {
        return (
            <BeheerUnauthorized
                title="Activiteit Scanner"
                description="Je hebt geen rechten om deze scanner te gebruiken."
            />
        );
    }

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href={`/beheer/activiteiten/${id}/aanmeldingen`}
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Stack gap={2}>
                            <Title order={1} size="h2" c="brand">
                                Scanner
                            </Title>
                            <Text size="sm" c="dimmed">
                                Scanner voor: &quot;{eventData.name}&quot;
                            </Text>
                        </Stack>
                    </Group>
                </Group>

                <AttendanceIsland eventId={String(id)} eventName={eventData.name} initialSignups={initialSignups} />
            </Stack>
        </Container>
    );
}