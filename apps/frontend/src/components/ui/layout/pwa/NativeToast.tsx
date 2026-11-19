'use client';

import { Download } from 'lucide-react';
import { Box, Button } from '@mantine/core';
import ToastHeader from './ToastHeader';

interface NativeToastProps {
    onInstall: () => void;
    onDismiss: () => void;
    installing: boolean;
}

export default function NativeToast({ onInstall, onDismiss, installing }: NativeToastProps) {
    return (
        <>
            <ToastHeader onDismiss={onDismiss} />
            <Box px="md" pb="md">
                <Button
                    id="pwa-install-btn"
                    type="button"
                    fullWidth
                    onClick={onInstall}
                    disabled={installing}
                    loading={installing}
                    leftSection={<Download size={16} />}
                    aria-label="Installeer de Salve Mundi app"
                >
                    {installing ? 'Bezig…' : 'Voeg toe aan beginscherm'}
                </Button>
            </Box>
        </>
    );
}
