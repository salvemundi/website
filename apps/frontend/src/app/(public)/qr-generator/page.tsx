import type { Metadata } from 'next';
import { Container, Stack, Text, Title } from '@mantine/core';
import QrGeneratorIsland from '@/components/islands/qr-generator/QrGeneratorIsland';

export const metadata: Metadata = {
    title: 'QR-code generator | Salve Mundi',
    description: 'Maak een eigen QR-code met het Salve Mundi logo in het midden en pas kleuren en grootte naar wens aan.',
};

export default function QrGeneratorPage() {
    return (
        <Container component="section" size="lg">
            <Stack gap="xl">
                <Stack gap="xs" align="center">
                    <Title order={1} ta="center">QR-code generator</Title>
                    <Text c="dimmed" ta="center" maw={600}>
                        Voer een link of tekst in en download een QR-code met het Salve Mundi logo.
                    </Text>
                </Stack>
                <QrGeneratorIsland />
            </Stack>
        </Container>
    );
}
