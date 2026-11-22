import { connection } from 'next/server';
import { Box, Card, Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import MembershipFormIsland from '@/components/islands/membership/MembershipFormIsland';
import MembershipStatusIsland from '@/components/islands/account/MembershipStatusIsland';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { fetchUserCommitteesDb, type Committee } from '@/server/internal/leden/leden-db.utils';
import { hasActiveCommitteeMembership } from '@/shared/lib/permissions';
import { safeConsoleError } from '@/server/utils/logger';

export const metadata = {
    title: 'Word Lid | Salve Mundi',
    description: 'Beheer je lidmaatschap bij Salve Mundi.'
};

export default async function MembershipPage() {
    await connection();

    const session = await getEnrichedSession();

    const user = session?.user;
    const isGuest = !user;

    let committees: Committee[] = [];
    if (user) {
        try {
            committees = await fetchUserCommitteesDb(user.id);
        } catch (error) {
            safeConsoleError('[page.tsx][MembershipPage] Error fetching committees:', error);
        }
    }

    const isCommitteeMember = hasActiveCommitteeMembership(committees);
    const baseAmount = isCommitteeMember ? 10.00 : 20.00;

    return (
        <PublicPageShell
            title={isGuest ? 'Word Lid!' : 'Mijn Lidmaatschap'}
            backgroundImage=""
        >
            {isGuest ? (
                <Container size="xl" py="xl">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
                        <Card padding="xl">
                            <Stack gap="lg">
                                <Title order={1} size="h2" c="brand">
                                    Inschrijven
                                </Title>
                                <MembershipFormIsland baseAmount={baseAmount} />
                            </Stack>
                        </Card>

                        <Box component="aside">
                            <Card padding="xl">
                                <Stack gap="md" align="center" ta="center">
                                    <Title order={2} c="brand">
                                        Waarom Lid Worden?
                                    </Title>
                                    <Text size="lg" c="dimmed">
                                        Als lid van Salve Mundi krijg je toegang tot exclusieve activiteiten en workshops.
                                        Word vandaag lid!
                                    </Text>
                                </Stack>
                            </Card>
                        </Box>
                    </SimpleGrid>
                </Container>
            ) : (
                <Container size="sm" py="xl">
                    <Card padding="xl">
                        <Stack gap="lg">
                            <Title order={1} size="h2" c="brand">
                                {user.membership_status === 'active' ? 'STATUS' : 'VERLENGEN'}
                            </Title>
                            <MembershipStatusIsland user={user} baseAmount={baseAmount} />
                        </Stack>
                    </Card>
                </Container>
            )}
        </PublicPageShell>
    );
}
