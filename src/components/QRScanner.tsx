// QR Code Scanner Component
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isScanning: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError, isScanning }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!isScanning) {
      stopScanning();
      return;
    }

    startScanning();

    return () => {
      stopScanning();
    };
  }, [isScanning]);

  const startScanning = async () => {
    try {
      setCameraError(null);
      
      // Create scanner instance
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      // Request camera permission and start scanning
      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Error callback (can be ignored for most cases)
          // Only log serious errors
          if (!errorMessage.includes('NotFoundException')) {
            console.warn('QR Scan error:', errorMessage);
          }
        }
      );
    } catch (error: any) {
      console.error('Failed to start QR scanner:', error);
      setCameraError(error.message || 'Kon camera niet starten');
      
      if (onScanError) {
        onScanError(error.message || 'Failed to start camera');
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.warn('Error stopping scanner:', error);
      }
    }
  };

  return (
    <div className="relative">
      {/* QR Reader container */}
      <div 
        id="qr-reader" 
        className="rounded-xl overflow-hidden border-4 border-oranje shadow-lg"
        style={{ maxWidth: '500px', margin: '0 auto' }}
      />

      {/* Error message */}
      {cameraError && (
        <div className="mt-4 bg-red-500 text-white p-4 rounded-lg">
          <p className="font-semibold">Camera Fout</p>
          <p className="text-sm mt-1">{cameraError}</p>
          <p className="text-sm mt-2">
            Zorg ervoor dat je toestemming hebt gegeven voor camera toegang in je browser instellingen.
          </p>
        </div>
      )}

      {/* Scanning indicator */}
      {isScanning && !cameraError && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-geel text-paars px-4 py-2 rounded-full">
            <div className="animate-pulse w-3 h-3 bg-paars rounded-full"></div>
            <span className="font-semibold">Scannen actief...</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!cameraError && (
        <div className="mt-4 bg-beige border-2 border-paars rounded-lg p-4">
          <p className="text-paars text-sm">
            <strong>📱 Instructies:</strong>
          </p>
          <ul className="text-paars text-sm mt-2 space-y-1 list-disc list-inside">
            <li>Houd de QR code binnen het vierkant</li>
            <li>Zorg voor goede verlichting</li>
            <li>Houd je camera stil</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
