import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import * as nextServer from 'next/server';

export const metadata = {
    title: 'QR Code | Salve Mundi Introductie',
    description: 'Hier vind je handige informatie tijdens de introductieweek.'
};

export default async function QRCodePage() {
    await nextServer.connection();

    return (
        <PublicPageShell>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20">
                {/* Page content goes here */}
            </div>
        </PublicPageShell>
    );
}
