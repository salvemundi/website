import type { Metadata } from 'next';
import { Container, Stack, Title } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata: Metadata = {
    title: 'Waar moet de prullenbakzak? | SV Salve Mundi',
    description: 'Instructievideo: waar moet de prullenbakzak gelaten worden?',
    robots: { index: false, follow: false },
};

export default function PrullenbakzakPage() {
    return (
        <PublicPageShell>
            <Container size="md" py="xl">
                <Stack align="center" gap="xl">
                    <Title order={1} c="brand" ta="center">
                        Waar moet de prullenbakzak gelaten worden??
                    </Title>
                    <video
                        controls
                        playsInline
                        preload="metadata"
                        style={{ width: '100%', maxWidth: 640, borderRadius: 'var(--mantine-radius-md)' }}
                    >
                        <source src="/video/prullenbak.mp4" type="video/mp4" />
                        Je browser ondersteunt geen video.
                    </video>
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
