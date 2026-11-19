'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Center } from '@mantine/core';

interface QRDisplayProps {
    qrToken: string;
    size?: number;
}

export default function QRDisplay({ qrToken, size = 200 }: QRDisplayProps) {
    if (!qrToken) return null;

    return (
        <Center
            bg="white"
            p="xs"
            style={{ borderRadius: 'var(--mantine-radius-lg)' }}
        >
            <QRCodeSVG
                value={qrToken}
                size={size}
                level="H"
                includeMargin={true}
                className="h-auto w-full"
            />
        </Center>
    );
}
