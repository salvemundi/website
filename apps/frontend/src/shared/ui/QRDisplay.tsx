'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Center, Paper } from '@mantine/core';

interface QRDisplayProps {
    qrToken: string;
    size?: number;
}

export default function QRDisplay({ qrToken, size = 200 }: QRDisplayProps) {
    if (!qrToken) return null;

    return (
        <Paper bg="var(--mantine-color-white)" p="xs">
            <Center>
                <QRCodeSVG
                    value={qrToken}
                    size={size}
                    level="H"
                    includeMargin={true}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                />
            </Center>
        </Paper>
    );
}
