import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { ChevronLeft, FileSignature } from 'lucide-react';
import { Button, Card, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { getMyNdas } from '@/server/actions/nda/member-nda.actions';

export const metadata: Metadata = {
    title: 'Mijn NDA\'s | SV Salve Mundi'
};

function getStatusLabel(status: string): string {
    switch (status) {
        case 'pending':
            return 'Actie vereist: ondertekenen';
        case 'signed':
            return 'Getekend';
        case 'expired':
            return 'Verlopen';
        case 'superseded':
            return 'Vervangen';
        default:
            return status;
    }
}

export default async function MyNdasPage() {
    const ndas = await getMyNdas();

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Stack component="header" gap="md">
                    <Group>
                        <Button
                            component={Link}
                            href="/profiel"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug naar profiel
                        </Button>
                    </Group>
                    <Title order={1}>Mijn NDA&apos;s</Title>
                </Stack>

                <Stack gap="md">
                    {ndas.length === 0 && (
                        <Text c="dimmed">Je hebt nog geen NDA-uitnodigingen.</Text>
                    )}
                    {ndas.map((nda) => (
                        <Card key={nda.id}>
                            <Group justify="space-between" gap="md" wrap="wrap">
                                <Group gap="md">
                                    <ThemeIcon size="lg">
                                        <FileSignature size={20} />
                                    </ThemeIcon>
                                    <Stack gap={2}>
                                        <Text fw={700}>{nda.committeeName}</Text>
                                        <Text size="sm" c="dimmed">{getStatusLabel(nda.status)}</Text>
                                    </Stack>
                                </Group>
                                {nda.status === 'pending' && (
                                    <Button component={Link} href={`/profiel/nda/${nda.id}`} size="sm">
                                        Ondertekenen
                                    </Button>
                                )}
                            </Group>
                        </Card>
                    ))}
                </Stack>
            </Stack>
        </Container>
    );
}
