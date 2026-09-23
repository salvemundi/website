'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRDisplayProps {
    qrToken: string;
    size?: number;
    className?: string;
}

export default function QRDisplay({ qrToken, size = 200, className = "" }: QRDisplayProps) {
    if (!qrToken) return null;

    return (
        <div className={`flex items-center justify-center rounded-2xl bg-white p-2 ${className}`}>
            <QRCodeSVG 
                value={qrToken} 
                size={size} 
                level="H"
                includeMargin={true}
                className="h-auto w-full"
            />
        </div>
    );
}
