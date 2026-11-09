import type { Metadata } from 'next';
import QrGeneratorIsland from '@/components/islands/qr-generator/QrGeneratorIsland';

export const metadata: Metadata = {
    title: 'QR-code generator | Salve Mundi',
    description: 'Maak een eigen QR-code met het Salve Mundi logo in het midden en pas kleuren en grootte naar wens aan.',
};

export default function QrGeneratorPage() {
    return (
        <div className="mx-auto max-w-7xl px-fluid-md py-fluid-lg">
            <div className="mx-auto w-full max-w-5xl">
                <h1 className="mb-2 text-center text-3xl font-black text-theme-purple">QR-code generator</h1>
                <p className="mx-auto mb-8 max-w-2xl text-center text-text-muted">
                    Voer een link of tekst in en download een QR-code met het Salve Mundi logo.
                </p>
                <QrGeneratorIsland />
            </div>
        </div>
    );
}
