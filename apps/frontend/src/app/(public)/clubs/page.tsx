import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Container, Divider, Stack, Text, Title } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import ClubsList from '@/components/ui/clubs/ClubsList';
import { getClubs } from '@/server/actions/public/clubs.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';

export const metadata: Metadata = {
    title: 'Clubs | SV Salve Mundi',
    description: 'Ontdek de clubs van SV Salve Mundi, waar alle leden welkom zijn.'
};

export default async function ClubsPage() {
    await connection();
    const [clubs, session] = await Promise.all([
        getClubs(),
        getEnrichedSession()
    ]);

    const currentUser = session?.user ?? null;
    const isActiveMember = currentUser?.membership_status === 'active';

    return (
        <PublicPageShell>
            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <Stack align="center" ta="center" gap="md">
                        <Title order={1} c="brand">
                            Onze Clubs
                        </Title>
                        <Text size="lg" c="dimmed" maw={640}>
                            Clubs zijn groepen waarin alle leden van harte welkom zijn. Sluit je aan bij de WhatsApp groep van een club die je aanspreekt!
                        </Text>
                        <Divider w={96} size="md" color="brand" />
                    </Stack>

                    <ClubsList initialClubs={clubs} isActiveMember={isActiveMember} />
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
