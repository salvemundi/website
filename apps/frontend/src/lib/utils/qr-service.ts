import QRCode from 'qrcode';
import { safeConsoleError } from '@/server/utils/logger';

export async function generateQRCode(data: string): Promise<string> {
    try {
        return await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            margin: 1,
            width: 300,
            color: { dark: '#7B2CBF', light: '#FFFFFF' }
        });
    } catch (error) {
        safeConsoleError('[qr-service.ts][generateQRCode] ', error);
        throw new Error('Failed to generate QR code');
    }
}