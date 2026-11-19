'use client';

import React from 'react';
import Image from 'next/image';
import { Box, Button, Modal, Stack, Text } from '@mantine/core';

interface AvatarPreviewModalProps {
    preview: string;
    isPending: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function AvatarPreviewModal({
    preview,
    isPending,
    onConfirm,
    onCancel
}: AvatarPreviewModalProps) {
    return (
        <Modal
            opened
            onClose={onCancel}
            title="Nieuwe profielfoto"
            centered
            size="sm"
            radius="lg"
            closeOnClickOutside={!isPending}
            closeOnEscape={!isPending}
        >
            <Stack align="center" gap="lg">
                <Box
                    pos="relative"
                    w={192}
                    h={192}
                    style={{
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        border: '4px solid var(--primary)',
                    }}
                >
                    <Image
                        src={preview}
                        alt="Preview"
                        fill
                        unoptimized
                        style={{ objectFit: 'cover' }}
                    />
                </Box>

                <Text size="sm" c="dimmed" ta="center">
                    Ziet dit er goed uit? Klik op opslaan om je nieuwe foto te gebruiken.
                </Text>

                <Stack w="100%" gap="xs">
                    <Button
                        type="button"
                        fullWidth
                        size="md"
                        onClick={onConfirm}
                        loading={isPending}
                    >
                        {isPending ? 'Uploaden...' : 'Opslaan'}
                    </Button>
                    <Button
                        type="button"
                        fullWidth
                        size="md"
                        variant="default"
                        onClick={onCancel}
                        disabled={isPending}
                    >
                        Annuleren
                    </Button>
                </Stack>
            </Stack>
        </Modal>
    );
}
