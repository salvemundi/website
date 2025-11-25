import React, { useState, useEffect } from 'react';
import { generateQRCode } from '../lib/qr-service';

interface QRDisplayProps {
  qrToken: string;
}

const QRDisplay: React.FC<QRDisplayProps> = ({ qrToken }) => {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!qrToken) return;

    const loadQR = async () => {
      setLoading(true);
      setError(null);
      try {
        // Gebruikt de functie uit qr-service.ts om de Data URL te genereren
        const url = await generateQRCode(qrToken);
        setQrImage(url);
      } catch (e: any) {
        console.error("Fout bij genereren QR code:", e);
        setError('Kon QR code niet genereren.');
      } finally {
        setLoading(false);
      }
    };

    loadQR();
  }, [qrToken]);

  if (loading) {
    return <div className="text-center text-paars">Laden QR Code...</div>;
  }

  if (error) {
    return <div className="text-center text-rood-paars p-3 border border-rood-paars rounded-lg">{error}</div>;
  }

  if (!qrImage) {
    return null; 
  }

  return (
    <div className="flex flex-col items-center p-4 bg-wit-beige rounded-xl shadow-inner">
      <h3 className="text-xl font-semibold text-paars mb-3">Jouw Digitale Ticket</h3>
      <div className="bg-wit p-2 border-2 border-paars rounded-lg">
        {/* Render de gegenereerde Base64 afbeelding */}
        <img 
          src={qrImage} 
          alt={`QR code voor ${qrToken}`} 
          style={{ width: 250, height: 250 }}
        />
      </div>
      <p className="text-xs text-grijs-donker mt-3 select-all">
        Token: {qrToken.substring(0, 4)}...{qrToken.substring(qrToken.length - 4)}
      </p>
    </div>
  );
};

export default QRDisplay;