import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RootProviders } from './providers';
import Header from '@/widgets/header/ui/Header';
import Footer from '@/widgets/footer/ui/Footer';

export const metadata: Metadata = {
    title: 'Salve Mundi - Studievereniging Fontys ICT Eindhoven',
    description: 'De studievereniging voor HBO-studenten in Eindhoven. Activiteiten, commissies, en meer voor een onvergetelijke studententijd.',
    metadataBase: new URL('https://salvemundi.nl'),
    openGraph: {
        title: 'Salve Mundi - Studievereniging Fontys ICT Eindhoven',
        description: 'De studievereniging voor HBO-studenten in Eindhoven. Activiteiten, commissies, en meer voor een onvergetelijke studententijd.',
        url: 'https://salvemundi.nl',
        siteName: 'Salve Mundi',
        locale: 'nl_NL',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Salve Mundi - Studievereniging Fontys ICT Eindhoven',
        description: 'De studievereniging voor HBO-studenten in Eindhoven. Activiteiten, commissies, en meer voor een onvergetelijke studententijd.',
    },
    icons: {
        icon: [
            { url: '/img/Logo.png', sizes: 'any' },
            { url: '/img/Logo.png', sizes: '32x32', type: 'image/png' },
            { url: '/img/Logo.png', sizes: '16x16', type: 'image/png' },
        ],
        apple: [
            { url: '/img/Logo.png', sizes: '180x180', type: 'image/png' },
        ],
    },
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
