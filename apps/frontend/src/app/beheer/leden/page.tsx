import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import LedenOverzichtIsland, { type Member } from '@/components/islands/beheer/leden/LedenOverzichtIsland';
import { EXCLUDED_EMAILS } from '@/shared/lib/constants/admin.constants';
import { db, schema } from '@salvemundi/db';
import { isNotNull, notInArray, and, asc } from 'drizzle-orm';
import { isMembershipActive } from '@/lib/leden/leden-utils';

export const metadata = {
    title: 'Leden Beheer | SV Salve Mundi'
};

export default async function LedenBeheerPage() {
    let members: Member[] = [];
    let totalCount = 0;

    const rows = await db.select({
        id: schema.directus_users.id,
        first_name: schema.directus_users.first_name,
        last_name: schema.directus_users.last_name,
        email: schema.directus_users.email,
        membership_expiry: schema.directus_users.membership_expiry,
        membership_status: schema.directus_users.membership_status,
        status: schema.directus_users.status
    })
    .from(schema.directus_users)
    .where(
        and(
            isNotNull(schema.directus_users.email),
            notInArray(schema.directus_users.email, EXCLUDED_EMAILS)
        )
    )
    .orderBy(asc(schema.directus_users.last_name), asc(schema.directus_users.first_name));

    members = rows as unknown as Member[];
    totalCount = rows.length;

    const activeCount = members.filter(m => isMembershipActive(m)).length;
    const inactiveCount = totalCount - activeCount;

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Title order={1} size="h2" c="brand">
                            Leden Overzicht
                        </Title>
                    </Group>

                    <Paper withBorder px="md" py="xs" visibleFrom="md">
                        <Group gap="md" wrap="nowrap">
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Totaal</Text>
                                <Text size="sm" fw={700} lh={1}>{totalCount}</Text>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Actief</Text>
                                <Text size="sm" fw={700} lh={1} c="success">{activeCount}</Text>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Verlopen</Text>
                                <Text size="sm" fw={700} lh={1} c="error">{inactiveCount}</Text>
                            </Stack>
                        </Group>
                    </Paper>
                </Group>

                <LedenOverzichtIsland initialMembers={members} />
            </Stack>
        </Container>
    );
}
