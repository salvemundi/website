import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RootProviders } from './providers';
import Header from '@/widgets/header/ui/Header';
import Footer from '@/widgets/footer/ui/Footer';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';

const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
            ? process.env.NEXT_PUBLIC_APP_URL
            : `https://${process.env.NEXT_PUBLIC_APP_URL}`;
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    return 'https://dev.salvemundi.nl';
};

export const metadata: Metadata = {
    title: 'Salve Mundi - Studievereniging Fontys ICT Eindhoven',
    description: 'De studievereniging voor HBO-studenten in Eindhoven. Activiteiten, commissies, en meer voor een onvergetelijke studententijd.',
    metadataBase: new URL(getBaseUrl()),
    openGraph: {
        title: 'Salve Mundi - Studievereniging Fontys ICT Eindhoven',
        description: 'De studievereniging voor HBO-studenten in Eindhoven. Activiteiten, commissies, en meer voor een onvergetelijke studententijd.',
        url: getBaseUrl(),
        siteName: 'Salve Mundi',
        locale: 'nl_NL',
        type: 'website',
        images: ['/logo_purple.svg'],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Salve Mundi - Studievereniging Fontys ICT Eindhoven',
        description: 'De studievereniging voor HBO-studenten in Eindhoven. Activiteiten, commissies, en meer voor een onvergetelijke studententijd.',
        images: ['/logo_purple.svg'],
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
    appleWebApp: {
        capable: true,
        title: 'Salve Mundi',
        statusBarStyle: 'default',
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
            <head>
                {/* Resource hints for better performance */}
                <link rel="preconnect" href="https://admin.salvemundi.nl" />
                <link rel="dns-prefetch" href="https://admin.salvemundi.nl" />

                
                {/* Preload critical assets */}
                <link rel="preload" href="/logo_purple.svg" as="image" />
                
                {/* Preload self-hosted Material Symbols font */}
                <link rel="preload" href="/fonts/material-symbols/MaterialSymbolsOutlined.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
            </head>
            <body className="min-h-screen bg-background dark:bg-background-darker text-ink dark:text-white relative transition-colors duration-300">
                <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-oranje/10/80 via-transparent to-oranje/20/60 dark:from-oranje/5/40 dark:to-paars/10/40" aria-hidden="true" />
                <RootProviders>
                    <ServiceWorkerRegistration />
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
