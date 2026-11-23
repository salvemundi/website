'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core';
import { useAuth } from '@/features/auth/providers/auth-provider';
import type { EnrichedUser } from '@/types/auth';

interface JoinSectionIslandProps {
    serverUser?: EnrichedUser | null;
}

export const JoinSectionIsland: React.FC<JoinSectionIslandProps> = ({
    serverUser = null
}) => {
    const { user: clientUser } = useAuth();
    const user = clientUser ?? serverUser;

    if (user?.membership_status === 'active') return null;

    const isRenewal = !!user && !!user.membership_expiry && user.membership_status !== 'active';

    const title = isRenewal ? 'Lidmaatschap verlopen?' : 'Klaar om lid te worden?';
    const buttonText = isRenewal ? 'Verlengen' : 'Word nu lid';
    const description = isRenewal
        ? 'Je lidmaatschap is niet meer geldig. Verleng je lidmaatschap voor slechts €20 per jaar en behoud toegang tot alle activiteiten met korting!'
        : 'Sluit je aan bij onze community van studenten en maak het meeste van je studententijd. Voor slechts €20 per jaar krijg je toegang tot alle activiteiten met korting!';

    return (
        <Container component="section" size="md">
            <Card padding="xl">
                <Stack align="center" gap="lg">
                    <Title order={2} ta="center" fz={{ base: '1.75rem', md: '2.5rem' }}>
                        {title}
                    </Title>
                    <Text size="lg" c="dimmed" ta="center" maw={600}>
                        {description}
                    </Text>
                    <Group justify="center" gap="md">
                        <Button component={Link} href="/lidmaatschap" size="lg">
                            {buttonText}
                        </Button>
                        <Button component={Link} href="/contact" size="lg">
                            Neem contact op
                        </Button>
                    </Group>
                </Stack>
            </Card>
        </Container>
    );
};
