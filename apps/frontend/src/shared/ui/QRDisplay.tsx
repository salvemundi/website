'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRDisplayProps {
    qrToken: string;
    size?: number;
    className?: string;
}

/**
 * Renders a high-quality SVG QR code for tickets and confirmations.
 * 
 * Why: SVG is used for sharp rendering on all screen sizes and 
 * better printable support.
 */
export default function QRDisplay({ qrToken, size = 200, className = "" }: QRDisplayProps) {
    if (!qrToken) return null;

    return (
        <div className={`flex items-center justify-center p-2 bg-white rounded-2xl ${className}`}>
            <QRCodeSVG 
                value={qrToken} 
                size={size} 
                level="H"
                includeMargin={true}
                className="w-full h-auto"
            />
        </div>
    );
}
