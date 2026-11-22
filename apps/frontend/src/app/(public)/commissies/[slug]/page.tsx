import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Box, Button, Container, Group, Stack } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { CommitteeDetail } from '@/components/ui/commissies/CommitteeDetail';
import { getCommitteeBySlug } from '@/server/actions/public/committees.actions';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const committee = await getCommitteeBySlug(slug);

    if (!committee) {
        return {
            title: 'Commissie niet gevonden | Salve Mundi'
        };
    }

    return {
        title: `${committee.name} | Salve Mundi`,
        description: committee.description || 'Ontdek deze commissie en wat zij doen voor de vereniging.'
    };
}

export default async function CommitteePage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;

    const committee = await getCommitteeBySlug(slug);

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
