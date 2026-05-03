import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
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
    metadataBase: new URL(process.env.PUBLIC_URL || 'https://salvemundi.nl'),
    title: {
        default: 'SV Salve Mundi | Studievereniging Fontys ICT',
        template: '%s | SV Salve Mundi'
    },
    description: 'SV Salve Mundi is de studievereniging voor Fontys ICT in Eindhoven. Ontdek onze activiteiten, commissies en word lid!',
    keywords: ['Fontys ICT', 'Studievereniging', 'Eindhoven', 'Salve Mundi', 'Studenten'],
    authors: [{ name: 'Salve Mundi ICT Commissie' }],
    creator: 'Salve Mundi',
    publisher: 'SV Salve Mundi',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Salve Mundi',
    },
    openGraph: {
        type: 'website',
        locale: 'nl_NL',
        url: 'https://salvemundi.nl',
        siteName: 'SV Salve Mundi',
        title: 'SV Salve Mundi | Studievereniging Fontys ICT',
        description: 'SV Salve Mundi is de studievereniging voor Fontys ICT in Eindhoven. Ontdek onze activiteiten, commissies en word lid!',
        images: [
            {
                url: '/img/newlogo.png',
                width: 1200,
                height: 630,
                alt: 'SV Salve Mundi Logo',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'SV Salve Mundi | Studievereniging Fontys ICT',
        description: 'De officiële studievereniging van Fontys ICT Eindhoven.',
        images: ['/img/newlogo.png'],
    },
    icons: {
        icon: [
            { url: '/img/newlogo.svg', type: 'image/svg+xml' },
        ],
        apple: [
            { url: '/img/newlogo.svg', type: 'image/svg+xml' },
        ],
    },
};

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '600', '700', '900'],
    variable: '--font-poppins',
});

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="nl" className="dark" suppressHydrationWarning>
            <head>
                <Suspense fallback={null}>
                    <ThemeScript />
                </Suspense>
                <link rel="preload" as="image" href="/img/newlogo.png" />
                <Suspense fallback={null}>
                    <HeadPreloads />
                </Suspense>
            </head>
            <body className={`${poppins.variable} antialiased flex flex-col min-h-screen`}>
                <Suspense fallback={null}>
                    <ImpersonationWrapper />
                </Suspense>

                <Suspense fallback={<div className="h-[80px] w-full bg-[var(--bg-main)]" />}>
                    <HeaderWrapper />
                    <main className="flex-grow min-h-[70vh] pt-[var(--header-total-height,var(--header-height,80px))]">
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

async function ThemeScript() {
    const nonce = (await headers()).get('x-nonce') || undefined;
    return (
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
    );
}

async function HeaderWrapper() {
    await connection();
    const [disabledRoutes, session, { impersonation, isAuthorized }] = await Promise.all([
        getDisabledRoutes(),
        auth.api.getSession({ headers: await headers() }),
        checkAdminAccess(),
    ]);

    return (
        <NavigationHeader 
            disabledRoutes={disabledRoutes} 
            initialSession={session} 
            impersonation={impersonation}
            isAdmin={isAuthorized}
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
    
    if (!impersonation) return null;

    return (
        <ImpersonationBanner 
            targetName={impersonation.targetName}
            adminName={impersonation.name}
            committees={impersonation.targetCommittees}
            isNormallyAdmin={impersonation.isNormallyAdmin}
        />
    );
}
