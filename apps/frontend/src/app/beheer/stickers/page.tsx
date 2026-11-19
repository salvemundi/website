import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { getStickers } from '@/server/actions/beheer/stickers/beheer-stickers.actions';
import StickerManagementIsland from '@/components/islands/beheer/StickerManagementIsland';

export const metadata = {
    title: 'Sticker Beheer | SV Salve Mundi',
    description: 'Beheer en modereer stickerlocaties.'
};

export default async function StickersAdminPage() {
    const stickers = await getStickers();

    const publishedCount = stickers.filter(s => s.status === 'published').length;
    const draftCount = stickers.filter(s => s.status === 'draft' || !s.status).length;

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Title order={1} size="h2" c="brand">
                            Sticker Beheer
                        </Title>
                    </Group>

                    <Paper withBorder px="md" py="xs" radius="lg">
                        <Group gap="md" wrap="nowrap">
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Stickers</Text>
                                <Text size="sm" fw={700} lh={1}>{stickers.length}</Text>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Gepubliceerd</Text>
                                <Text size="sm" fw={700} lh={1} c="success">{publishedCount}</Text>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Afwachting</Text>
                                <Text size="sm" fw={700} lh={1} c={draftCount > 0 ? 'accent' : undefined}>
                                    {draftCount}
                                </Text>
                            </Stack>
                        </Group>
                    </Paper>
                </Group>

                <StickerManagementIsland initialStickers={stickers} />
            </Stack>
        </Container>
    );
}

