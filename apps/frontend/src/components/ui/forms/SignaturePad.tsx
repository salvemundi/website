'use client';

import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import SignaturePadLib from 'signature_pad';
import { RotateCcw } from 'lucide-react';

export interface SignaturePadHandle {
    isEmpty: () => boolean;
    clear: () => void;
    toBlob: () => Promise<Blob | null>;
}

export interface SignaturePadProps {
    className?: string;
    height?: number;
}

export const SignaturePad = React.forwardRef<SignaturePadHandle, SignaturePadProps>(({ className = '', height = 200 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const padRef = useRef<SignaturePadLib | null>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const pad = new SignaturePadLib(canvas, { backgroundColor: 'rgb(255, 255, 255)' });
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
            // Decode the data URL manually instead of fetch()-ing it: a strict
            // Content-Security-Policy connect-src can block fetch() on data: URIs.
            const dataUrl = pad.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1] ?? '';
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return new Blob([bytes], { type: 'image/png' });
        },
    }), []);

    return (
        <div className={`relative rounded-(--beheer-radius) border border-(--beheer-border) bg-white ${className}`}>
            <canvas
                ref={canvasRef}
                style={{ height, touchAction: 'none' }}
                className="w-full cursor-crosshair rounded-(--beheer-radius)"
            />
            {isEmpty && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                    Teken hier je handtekening
                </span>
            )}
            <button
                type="button"
                onClick={() => {
                    padRef.current?.clear();
                    setIsEmpty(true);
                }}
                className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs text-gray-600 border border-(--beheer-border) hover:bg-gray-50"
            >
                <RotateCcw className="size-3" />
                Wissen
            </button>
        </div>
    );
});

SignaturePad.displayName = 'SignaturePad';
