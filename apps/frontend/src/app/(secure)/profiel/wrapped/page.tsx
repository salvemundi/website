import Link from '@/components/ui/Link';
import { Button, Container, Stack, Text, Title } from '@mantine/core';
import { getMySamuWrapped } from '@/server/actions/profile/samu-wrapped.actions';
import SamuWrappedIsland from '@/components/islands/account/wrapped/SamuWrappedIsland';

export const metadata = {
    title: 'Samu Wrapped | SV Salve Mundi',
    description: 'Jouw jaar bij Salve Mundi in cijfers.'
};

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ jaar?: string }>;
}

export default async function SamuWrappedPage({ searchParams }: PageProps) {
    const { jaar } = await searchParams;
    const result = await getMySamuWrapped(jaar ? Number(jaar) : undefined);

    if (result.status !== 'ok') {
        return (
            <Container size="xs" py={80}>
                <Stack align="center" gap="md" ta="center">
                    <Text fz={48}>🎁</Text>
                    <Title order={1} fz="h2">Samu Wrapped komt eraan</Title>
                    <Text c="dimmed">
                        Aan het einde van het jaar zie je hier jouw persoonlijke jaaroverzicht. Nog even geduld!
                    </Text>
                    <Button component={Link} href="/profiel" mt="sm">Terug naar profiel</Button>
                </Stack>
            </Container>
        );
    }

    return <SamuWrappedIsland stats={result.stats} />;
}
