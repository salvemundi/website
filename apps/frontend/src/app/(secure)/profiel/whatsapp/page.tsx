import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { getWhatsAppGroups } from '@/server/actions/profile/profiel.actions';
import { WhatsAppGroupsIsland } from '@/components/islands/social/WhatsAppGroupsIsland';
import { getEnrichedSession } from '@/server/auth/auth-utils';

export const metadata: Metadata = {
    title: 'WhatsApp Groepen | SV Salve Mundi',
    description: 'Word lid van onze exclusieve WhatsApp groepen voor leden.'
};

export default async function WhatsAppGroepenPage() {
    const session = await getEnrichedSession();

    if (!session?.user) {
        redirect('/');
    }

    if (session.user.membership_status !== 'active') {
        redirect('/lidmaatschap');
    }

    const groups = await getWhatsAppGroups();
    const gedragscodeUrl = '/gedragscode';

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Stack component="header" gap="md">
                    <Group>
                        <Button
                            component={Link}
                            href="/profiel"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                    </Group>
                    <Title order={1}>WhatsApp Groepen</Title>
                    <Text size="lg" c="dimmed" maw={720}>
                        Word lid van onze WhatsApp groepen om verbonden te blijven.
                    </Text>
                </Stack>

                <WhatsAppGroupsIsland groups={groups} gedragscodeUrl={gedragscodeUrl} />
            </Stack>
        </Container>
    );
}
