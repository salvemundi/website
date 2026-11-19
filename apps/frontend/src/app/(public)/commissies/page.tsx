import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Container, Divider, Stack, Text, Title } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import CommitteesList from '@/components/ui/commissies/CommitteesList';
import { getCommittees } from '@/server/actions/public/committees.actions';

export const metadata: Metadata = {
    title: 'Commissies | SV Salve Mundi',
    description: 'Ontdek onze commissies die SV Salve Mundi draaiende houden.'
};

export default async function CommissiesPage() {
    await connection();
    const committees = await getCommittees();

    return (
        <PublicPageShell>
            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <Stack align="center" ta="center" gap="md">
                        <Title order={1} c="brand">
                            Onze Commissies
                        </Title>
                        <Text size="lg" c="dimmed" maw={640}>
                            Ontdek onze commissies die SV Salve Mundi draaiende houden.
                        </Text>
                        <Divider w={96} size="md" color="brand" />
                    </Stack>
                    <CommitteesList initialCommittees={committees} />
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
