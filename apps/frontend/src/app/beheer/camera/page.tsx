import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack, Title } from '@mantine/core';
import { getCameraLoansDb, getCameraPhotographersDb, getCameraRequestsDb } from '@/server/queries/camera/beheer-camera.queries';
import BeheerCameraIsland from '@/components/islands/beheer/camera/BeheerCameraIsland';
import { connection } from 'next/server';

export const metadata: Metadata = {
    title: 'Camera Beheer | Salve Mundi',
    description: 'Beoordeel cameraaanvragen, wijs fotografen toe en beheer de lijst met toegelaten fotografen.',
};

export default async function BeheerCameraPage() {
    await connection();
    const [requests, photographers, loans] = await Promise.all([
        getCameraRequestsDb(),
        getCameraPhotographersDb(),
        getCameraLoansDb(),
    ]);

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
                            Camera Beheer
                        </Title>
                    </Group>
                </Group>

                <BeheerCameraIsland requests={requests} photographers={photographers} loans={loans} />
            </Stack>
        </Container>
    );
}
