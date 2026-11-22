'use client';

import dynamic from 'next/dynamic';
import { Center, Loader, Stack, Text } from '@mantine/core';
import type { StickerPublic } from '@salvemundi/validations';
import type { EnrichedUser } from '@/types/auth';

const StickerMapIsland = dynamic(
    () => import('./StickerMapIsland'),
    {
        ssr: false,
        loading: () => (
            <Center
                h="100%"
                mih={400}
                w="100%"
                bg="var(--mantine-color-default)"
                style={{
                    borderRadius: 'var(--mantine-radius-lg)',
                    border: '1px solid var(--mantine-color-default-border)',
                }}
            >
                <Stack align="center" gap="sm">
                    <Loader size="md" />
                    <Text size="sm" fw={600} c="dimmed" tt="uppercase">
                        Kaart aan het laden...
                    </Text>
                </Stack>
            </Center>
        ),
    }
);

interface StickerMapBridgeProps {
    initialStickers: StickerPublic[];
    user: EnrichedUser | null;
}

export default function StickerMapBridge(props: StickerMapBridgeProps) {
    return <StickerMapIsland {...props} />;
}
