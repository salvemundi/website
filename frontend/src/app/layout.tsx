import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RootProviders } from './providers';
import Header from '@/shared/components/sections/Header';
import Footer from '@/shared/components/sections/Footer';

export const metadata: Metadata = {
    title: 'Salve Mundi - Studievereniging Fontys ICT Eindhoven',
    description: 'De studievereniging voor HBO-studenten in Eindhoven. Activiteiten, commissies, en meer voor een onvergetelijke studententijd.',
    metadataBase: new URL('https://salvemundi.nl'),
};

export const viewport: Viewport = {
    themeColor: '#ff6542',
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="nl" suppressHydrationWarning>
            <body className="min-h-screen bg-background dark:bg-background-darker text-ink dark:text-white relative transition-colors duration-300">
                <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-oranje/10/80 via-transparent to-oranje/20/60 dark:from-oranje/5/40 dark:to-paars/10/40" aria-hidden="true" />
                <RootProviders>
                    <Header />
                    <div className="relative z-10">
                        {children}
                    </div>
                    <Footer />
                </RootProviders>
            </body>
        </html>
    );
}
