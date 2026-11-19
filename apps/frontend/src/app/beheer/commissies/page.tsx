import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import CommitteeManagementIsland from '@/components/islands/beheer/commissies/CommitteeManagementIsland';
import { getCommittees, getCommitteeMembers, countUniqueCommitteeMembers } from '@/server/queries/commissies/beheer-commissies.queries';

export const metadata: Metadata = {
    title: 'Commissies Beheer | SV Salve Mundi'
};

export default async function CommissiesBeheerPage() {
    const [committees, totalUniqueMembers] = await Promise.all([
        getCommittees().catch(() => []),
        countUniqueCommitteeMembers().catch(() => 0),
    ]);

    const firstCommittee = committees[0] as typeof committees[0] | undefined;
    const initialMembers = firstCommittee ? await getCommitteeMembers(firstCommittee.id.toString()).catch(() => []) : [];

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Title order={1} size="h2" c="brand">
                            Commissies
                        </Title>
                    </Group>

                    <Paper withBorder px="md" py="xs" radius="lg" visibleFrom="md">
                        <Group gap="md" wrap="nowrap">
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Groepen</Text>
                                <Text size="sm" fw={700} lh={1}>{committees.length}</Text>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Totaal Leden</Text>
                                <Text size="sm" fw={700} lh={1}>{totalUniqueMembers}</Text>
                            </Stack>
                        </Group>
                    </Paper>
                </Group>

                <CommitteeManagementIsland
                    initialCommittees={committees}
                    initialMembers={initialMembers}
                />
            </Stack>
        </Container>
    );
}
