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
import { getHeroBanners, getUpcomingActiviteiten } from '@/server/actions/home.actions';
import { getImageUrl } from '@/lib/utils/image-utils';

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
                <link rel="preload" as="image" href="/img/newlogo.png" />
                <Suspense fallback={null}>
                    <HeadPreloads />
                </Suspense>
            </head>
            <body className="antialiased flex flex-col min-h-screen">
                <Suspense fallback={null}>
                    <ImpersonationWrapper />
                </Suspense>

                <Suspense fallback={null}>
                    <HeaderWrapper />
                    <main className="flex-grow pt-[var(--header-total-height,var(--header-height,72px))]">
                        {children}
                    </main>
                    <FooterWrapper />
                </Suspense>
            </body>
        </html>
    );
}

/**
 * ASSET HINTING: Fetch critical above-the-fold content paths early.
 * This runs in parallel with the Page fetch.
 */
async function HeadPreloads() {
    const [banners, activities] = await Promise.all([
        getHeroBanners().catch(() => []),
        getUpcomingActiviteiten(4).catch(() => [])
    ]);

    const criticalImages = [
        ...(banners[0]?.afbeelding_id ? [getImageUrl(banners[0].afbeelding_id, { width: 1200, height: 800, fit: 'cover' })] : []),
        ...activities.slice(0, 2).map((a: any) => a.afbeelding_id ? getImageUrl(a.afbeelding_id, { width: 400, height: 300, fit: 'cover' }) : null).filter(Boolean)
    ];

    return (
        <>
            {criticalImages.map((src, idx) => (
                <link key={`preload-img-${idx}`} rel="preload" as="image" href={src!} />
            ))}
        </>
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
    const [documents, disabledRoutes, committees, session] = await Promise.all([
        getDocumenten(),
        getDisabledRoutes(),
        getCommittees(),
        auth.api.getSession({ headers: await headers() }),
    ]);

    return (
        <FooterIsland
            documents={documents}
            disabledRoutes={disabledRoutes}
            committees={committees}
            initialSession={session}
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
