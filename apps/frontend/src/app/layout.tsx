import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import NavigationHeader from '@/components/islands/NavigationHeader';
import NavigationHeaderSkeleton from '@/components/ui/NavigationHeaderSkeleton';
import FooterIsland from '@/components/islands/FooterIsland';
import FooterSkeleton from '@/components/ui/FooterSkeleton';
import { getDocumenten, getDisabledRoutes } from '@/server/actions/website.actions';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

export const metadata: Metadata = {
    title: 'Salve Mundi V7',
    description: 'SV Salve Mundi — Digitaal platform voor Fontys ICT.',
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="nl" className="dark" suppressHydrationWarning>
            <head>
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

                <main
                    className="flex-grow"
                    style={{ paddingTop: 'var(--header-total-height, var(--header-height, 72px))' }}
                >
                    {children}
                </main>

                <Suspense fallback={<FooterSkeleton />}>
                    <FooterWrapper />
                </Suspense>
            </body>
        </html>
    );
}

async function HeaderWrapper() {
    const [disabledRoutes, session] = await Promise.all([
        getDisabledRoutes(),
        auth.api.getSession({
            headers: await headers()
        })
    ]);

    return (
        <NavigationHeader
            disabledRoutes={disabledRoutes}
            initialSession={session}
        />
    );
}

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
