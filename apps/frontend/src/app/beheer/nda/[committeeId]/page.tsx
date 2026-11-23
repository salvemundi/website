import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import NdaCommitteeDetailIsland from '@/components/islands/beheer/nda/NdaCommitteeDetailIsland';
import { getCommitteeNdaDetail } from '@/server/actions/beheer/nda/beheer-nda-templates.actions';
import { getNdaSettings } from '@/server/actions/beheer/nda/beheer-nda-settings.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';

export const metadata: Metadata = {
    title: 'NDA Commissie | SV Salve Mundi'
};

export default async function BeheerNdaCommitteePage({ params }: { params: Promise<{ committeeId: string }> }) {
    const { committeeId } = await params;
    const id = Number(committeeId);

    const [detail, settings, session] = await Promise.all([
        getCommitteeNdaDetail(id),
        getNdaSettings(),
        getEnrichedSession(),
    ]);

    if (!detail) {
        notFound();
    }

    const isSecretary = !!settings.secretaryUserId && settings.secretaryUserId === session?.user.id;

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer/nda"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Title order={1} size="h2" c="brand">
                            NDA — {detail.committee.name}
                        </Title>
                    </Group>
                </Group>

                <NdaCommitteeDetailIsland detail={detail} isSecretary={isSecretary} />
            </Stack>
        </Container>
    );
}
