"use client";

import { useEffect, useState } from 'react';
import qrService from '@/lib/qr-service';

interface QRDisplayProps {
    qrToken: string;
    size?: number;
    className?: string;
}

export default function QRDisplay({ qrToken, size = 250, className = '' }: QRDisplayProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generateQR = async () => {
            try {
                const dataUrl = await qrService.generateQRCode(qrToken);
                setQrDataUrl(dataUrl);
            } catch (err) {
                console.error('Failed to generate QR code:', err);
                setError('Kon QR-code niet genereren');
            }
        };

        if (qrToken) {
            generateQR();
        }
    }, [qrToken]);

    if (error) {
        return (
            <div className={`flex items-center justify-center ${className}`}>
                <div className="text-red-500 text-center">
                    <p className="font-semibold text-sm">⚠️ QR Code fout</p>
                    <p className="text-xs">{error}</p>
                </div>
            </div>
        );
    }

    if (!qrDataUrl) {
        return (
            <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Laden...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className="bg-white p-4 rounded-xl border-3 border-[var(--color-purple-theme)] shadow-lg">
                <img 
                    src={qrDataUrl} 
                    alt="QR Code voor toegang" 
                    style={{ width: size, height: size }}
                    className="block"
                />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center max-w-xs leading-tight">
                Laat deze code scannen bij de ingang
            </p>
        </div>
    );
}
