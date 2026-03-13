import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import NavigationHeader from '@/components/islands/NavigationHeader';
import NavigationHeaderSkeleton from '@/components/ui/NavigationHeaderSkeleton';
import FooterIsland from '@/components/islands/FooterIsland';
import FooterSkeleton from '@/components/ui/FooterSkeleton';
import { getDocumenten, getDisabledRoutes } from '@/server/actions/website.actions';

export const metadata: Metadata = {
    title: 'Salve Mundi V7',
    description: 'SV Salve Mundi — Digitaal platform voor Fontys ICT.',
};

// RootLayout — De shell zelf is statisch voor maximale Performance (PPR).
// Data-fetching is verplaatst naar sub-components binnen Suspense boundaries.
export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="nl" className="dark" suppressHydrationWarning>
            <head>
                {/* 
                  Dark Mode Blocking Script:
                  Zorgt ervoor dat de site donker start (default), maar switcht naar licht 
                  als de gebruiker dat eerder expliciet heeft gekozen in de localStorage.
                */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            try {
                                if (localStorage.theme === 'light') {
                                    document.documentElement.classList.remove('dark');
                                }
                            } catch (_) {}
                        `,
                    }}
                />
                {/* Preload fonts to prevent Layout Shift (CLS) on hard refresh */}
                <link
                    rel="preload"
                    href="/fonts/poppins/Poppins-Regular.ttf"
                    as="font"
                    type="font/ttf"
                    crossOrigin="anonymous"
                />
                <link
                    rel="preload"
                    href="/fonts/poppins/Poppins-Bold.ttf"
                    as="font"
                    type="font/ttf"
                    crossOrigin="anonymous"
                />
            </head>
            <body className="antialiased flex flex-col min-h-screen">
                <Suspense fallback={<NavigationHeaderSkeleton />}>
                    <HeaderWrapper />
                </Suspense>

                {/* Compenseer de hoogte van de vaste navbar via de CSS-variabele */}
                <main
                    className="flex-grow"
                    style={{ paddingTop: 'var(--header-total-height, var(--header-height, 72px))' }}
                >
                    {children}
                </main>

                {/* 
                  FooterIsland wordt server-side gefetched binnen deze wrapper.
                  Data ophalen blokkeert de rest van de pagina niet.
                */}
                <Suspense fallback={<FooterSkeleton />}>
                    <FooterWrapper />
                </Suspense>
            </body>
        </html>
    );
}


/**
 * Wrapper component voor de navigatie.
 */
async function HeaderWrapper() {
    const disabledRoutes = await getDisabledRoutes();

    return (
        <NavigationHeader
            disabledRoutes={disabledRoutes}
        />
    );
}


/**
 * Wrapper component voor de footer.
 * Haalt documenten en disabled routes parallel op.
 */
async function FooterWrapper() {
    const [documents, disabledRoutes] = await Promise.all([
        getDocumenten(),
        getDisabledRoutes()
    ]);

    return (
        <FooterIsland
            documents={documents}
            disabledRoutes={disabledRoutes}
        />
    );
}
