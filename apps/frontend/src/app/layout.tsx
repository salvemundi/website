import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import NavigationHeader from '@/components/islands/layout/NavigationHeader';
import NavigationHeaderSkeleton from '@/components/ui/layout/NavigationHeaderSkeleton';
import FooterIsland from '@/components/islands/layout/FooterIsland';
import FooterSkeleton from '@/components/ui/layout/FooterSkeleton';
import { getDocumenten, getDisabledRoutes } from '@/server/actions/website.actions';
import { getCommittees } from '@/server/actions/committees.actions';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { connection } from 'next/server';

export const metadata: Metadata = {
    metadataBase: new URL(process.env.PUBLIC_URL!),
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
                    <Suspense fallback={null}>
                        {children}
                    </Suspense>
                </main>

                <Suspense fallback={<FooterSkeleton />}>
                    <FooterWrapper />
                </Suspense>
            </body>
        </html>
    );
}

async function HeaderWrapper() {
    await connection();
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
    await connection();
    const [documents, disabledRoutes, committees] = await Promise.all([
        getDocumenten(),
        getDisabledRoutes(),
        getCommittees(),
    ]);

    return (
        <FooterIsland
            documents={documents}
            disabledRoutes={disabledRoutes}
            committees={committees}
        />
    );
}
