'use client';

import { useEffect, useMemo, useState } from 'react';
import NextImage from 'next/image';
import { Center, Paper } from '@mantine/core';
import { buildSalveMundiQr, svgToDataUri, type LogoRgba } from '@/lib/qr/qr-render';
import { QR_LOGO_SOURCES, getCachedLogo, loadPreparedLogo } from '@/lib/qr/qr-client';
import { safeConsoleError } from '@/server/utils/logger';

interface QRDisplayProps {
    qrToken: string;
    size?: number;
}

export default function QRDisplay({ qrToken, size = 200 }: QRDisplayProps) {
    const [logo, setLogo] = useState<LogoRgba | null>(() => getCachedLogo(QR_LOGO_SOURCES.kleur));

    useEffect(() => {
        if (logo) return;
        let cancelled = false;
        loadPreparedLogo(QR_LOGO_SOURCES.kleur)
            .then((result) => {
                if (!cancelled) setLogo(result);
            })
            .catch((err: unknown) => safeConsoleError('[QRDisplay.tsx][loadPreparedLogo] ', err));
        return () => {
            cancelled = true;
        };
    }, [logo]);

    const svgUri = useMemo(() => {
        if (!qrToken) return '';
        const { svg } = buildSalveMundiQr(qrToken, logo, { size: Math.max(size * 2, 400) });
        return svgToDataUri(svg);
    }, [qrToken, logo, size]);

    if (!qrToken || !svgUri) return null;

    return (
        <Paper bg="var(--mantine-color-white)" p="xs">
            <Center>
                <NextImage
                    src={svgUri}
                    alt="Ticket QR-code"
                    width={size}
                    height={size}
                    unoptimized
                    style={{ width: '100%', maxWidth: size, height: 'auto', display: 'block' }}
                />
            </Center>
        </Paper>
    );
}
