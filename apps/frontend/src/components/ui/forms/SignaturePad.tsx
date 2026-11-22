'use client';

import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import SignaturePadLib from 'signature_pad';
import { RotateCcw } from 'lucide-react';
import { Button, Center, Paper, Text } from '@mantine/core';
import { BRAND_COLORS } from '@/lib/config/theme';

export interface SignaturePadHandle {
    isEmpty: () => boolean;
    clear: () => void;
    toBlob: () => Promise<Blob | null>;
}

export interface SignaturePadProps {
    height?: number;
}

export const SignaturePad = React.forwardRef<SignaturePadHandle, SignaturePadProps>(({ height = 200 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const padRef = useRef<SignaturePadLib | null>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const pad = new SignaturePadLib(canvas, { backgroundColor: BRAND_COLORS.lightSurface });
        padRef.current = pad;

        const handleChange = () => setIsEmpty(pad.isEmpty());
        pad.addEventListener('endStroke', handleChange);

        const resizeCanvas = () => {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const { width, height: elHeight } = canvas.getBoundingClientRect();
            canvas.width = width * ratio;
            canvas.height = elHeight * ratio;
            const ctx = canvas.getContext('2d');
            ctx?.scale(ratio, ratio);
            pad.clear();
            setIsEmpty(true);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            pad.removeEventListener('endStroke', handleChange);
            pad.off();
        };
    }, []);

    useImperativeHandle(ref, () => ({
        isEmpty: () => padRef.current?.isEmpty() ?? true,
        clear: () => {
            padRef.current?.clear();
            setIsEmpty(true);
        },
        toBlob: async () => {
            const pad = padRef.current;
            if (!pad || pad.isEmpty()) return null;
            const dataUrl = pad.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1] ?? '';
            const binary = atob(base64);
            const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
            return new Blob([bytes], { type: 'image/png' });
        },
    }), []);

    return (
        <Paper
            bg="var(--mantine-color-white)"
            pos="relative"
            style={{
                border: '1px solid var(--mantine-color-default-border)',
                overflow: 'hidden',
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    height,
                    width: '100%',
                    touchAction: 'none',
                    cursor: 'crosshair',
                    display: 'block',
                    borderRadius: 'var(--mantine-radius-md)',
                }}
            />
            {isEmpty && (
                <Center pos="absolute" inset={0} style={{ pointerEvents: 'none' }}>
                    <Text size="sm" c="var(--mantine-color-darkBase-filled)" opacity={0.45}>
                        Teken hier je handtekening
                    </Text>
                </Center>
            )}
            <Button
                type="button"
                size="xs"
                pos="absolute"
                top={8}
                right={8}
                leftSection={<RotateCcw size={12} />}
                onClick={() => {
                    padRef.current?.clear();
                    setIsEmpty(true);
                }}
            >
                Wissen
            </Button>
        </Paper>
    );
});

SignaturePad.displayName = 'SignaturePad';
