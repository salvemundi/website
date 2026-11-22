import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { ChevronLeft } from 'lucide-react';
import { Box, Button, Container, Group, Stack } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { getCommitteeBySlug } from '@/server/actions/public/committees.actions';
import { CommitteeDetail } from '@/components/ui/commissies/CommitteeDetail';

export const metadata: Metadata = {
    title: 'Bestuur | Salve Mundi',
    description: 'Het bestuur van Salve Mundi'
};

export default async function BestuurPage() {
    await connection();
    const committee = await getCommitteeBySlug('bestuur');

    if (!committee) {
        notFound();
    }

    return (
        <PublicPageShell>
            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <Group>
                        <Button
                            component={Link}
                            href="/commissies"
                            title="Terug naar overzicht"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                    </Group>
                    <Box component="main">
                        <CommitteeDetail committee={committee} />
                    </Box>
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
