'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Container, Paper, Stack, Text, Title } from '@mantine/core';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { deleteSticker, updateSticker } from '@/server/actions/beheer/stickers/beheer-stickers.actions';
import StickersTable from '@/components/admin/stickers/StickersTable';
import { type StickerPublic } from '@salvemundi/validations';
import { safeConsoleError } from '@/server/utils/logger';

type AdminSticker = Omit<StickerPublic, 'user_updated' | 'date_updated'>;

interface StickerManagementIslandProps {
    initialStickers: AdminSticker[];
}

export default function StickerManagementIsland({
    initialStickers
}: StickerManagementIslandProps) {
    const { showToast } = useAdminToast();
    const [stickers, setStickers] = useState(initialStickers);

    const handleDelete = async (id: number) => {
        try {
            await deleteSticker(id);
            setStickers(prev => prev.filter(s => s.id !== id));
            showToast('Sticker succesvol verwijderd', 'success');
        } catch (error) {
            safeConsoleError('[StickerManagementIsland.tsx][StickerManagementIsland] ', error);
            showToast('Fout bij verwijderen', 'error');
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await updateSticker(id, { status: 'published' });
            setStickers(prev => prev.map(s => s.id === id ? { ...s, status: 'published' } : s));
            showToast('Sticker succesvol gepubliceerd', 'success');
        } catch (error) {
            safeConsoleError('[StickerManagementIsland.tsx][StickerManagementIsland] ', error);
            showToast('Fout bij publiceren', 'error');
        }
    };

    return (
        <Container size="xl" py="xl">
            {stickers.length > 0 ? (
                <StickersTable
                    stickers={stickers}
                    onDelete={(id) => {
                        void handleDelete(id);
                    }}
                    onApprove={(id) => {
                        void handleApprove(id);
                    }}
                />
            ) : (
                <Paper withBorder p="xl" ta="center" style={{ borderStyle: 'dashed' }}>
                    <Stack align="center" gap="xs" py="xl">
                        <AlertCircle size={48} opacity={0.25} />
                        <Title order={2} size="h3">Geen stickers gevonden</Title>
                        <Text size="sm" c="dimmed">Er zijn nog geen stickers geregistreerd.</Text>
                    </Stack>
                </Paper>
            )}
        </Container>
    );
}
