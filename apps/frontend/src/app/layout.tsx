import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import NavigationHeader from '@/components/islands/layout/NavigationHeader';
import FooterIsland from '@/components/islands/layout/FooterIsland';
import ImpersonationBanner from '@/components/ui/admin/ImpersonationBanner';
import { getDocumenten, getDisabledRoutes } from '@/server/actions/website.actions';
import { getCommittees } from '@/server/actions/committees.actions';
import { auth } from '@/server/auth/auth';
import { checkAdminAccess } from '@/server/actions/admin.actions';
import { headers } from 'next/headers';
import { connection } from 'next/server';

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#1a141b' },
    ],
};

export const metadata: Metadata = {
    metadataBase: new URL(process.env.PUBLIC_URL!),
    title: 'Salve Mundi V7',
    description: 'SV Salve Mundi — Digitaal platform voor Fontys ICT.',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Salve Mundi',
    },
};

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const nonce = (await headers()).get('x-nonce') || undefined;

    return (
        <html lang="nl" className="dark" suppressHydrationWarning>
            <head>
                <script
                    nonce={nonce}
                    suppressHydrationWarning
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
                <Suspense fallback={null}>
                    <ImpersonationWrapper />
                </Suspense>
                
                <Suspense fallback={<div className="h-[var(--header-total-height,var(--header-height,72px))] w-full bg-[var(--bg-card)] border-b border-[var(--border-color)] skeleton-active" />}>
                    <HeaderWrapper />
                </Suspense>

                <main className="flex-grow pt-[var(--header-total-height,var(--header-height,72px))]">
                    <Suspense fallback={null}>
                        {children}
                    </Suspense>
                </main>

                <Suspense fallback={<div className="h-64 w-full bg-[var(--bg-card)] border-t border-[var(--border-color)] skeleton-active" />}>
                    <FooterWrapper />
                </Suspense>
            </body>
        </html>
    );
}

async function HeaderWrapper() {
    await connection();
    const [disabledRoutes, session, { impersonation }] = await Promise.all([
        getDisabledRoutes(),
        auth.api.getSession({ headers: await headers() }),
        checkAdminAccess(),
    ]);

    return (
        <NavigationHeader 
            disabledRoutes={disabledRoutes} 
            initialSession={session} 
            impersonation={impersonation}
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

async function ImpersonationWrapper() {
    await connection();
    const { impersonation } = await checkAdminAccess();
    
    if (!impersonation || impersonation.error) return null;

    return (
        <ImpersonationBanner 
            name={impersonation.name}
            committees={impersonation.committees}
            isNormallyAdmin={impersonation.isNormallyAdmin}
        />
    );
}
