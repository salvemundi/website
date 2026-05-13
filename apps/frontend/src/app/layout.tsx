import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import NavigationHeader from '@/components/islands/layout/NavigationHeader';
import dynamic from 'next/dynamic';

const FooterIsland = dynamic(() => import('@/components/islands/layout/FooterIsland'));

import ImpersonationBanner from '@/components/ui/admin/ImpersonationBanner';
import { getDocumenten, getDisabledRoutes } from '@/server/actions/public/website.actions';
import { getCommittees } from '@/server/actions/public/committees.actions';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import { headers } from 'next/headers';
import { connection } from 'next/server';
import { getHeroBanners, getUpcomingActiviteiten } from '@/server/actions/public/home.actions';
import { getImageUrl } from '@/lib/utils/image-utils';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { type ExtendedSession, type ImpersonationInfo } from '@/types/auth';
import { type Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { domMax, LazyMotion } from 'framer-motion';

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#1a141b' },
    ],
    viewportFit: 'cover'
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
        statusBarStyle: 'black-translucent',
        title: 'Salve Mundi'
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
                alt: 'SV Salve Mundi Logo'
            },
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: 'SV Salve Mundi | Studievereniging Fontys ICT',
        description: 'De officiële studievereniging van Fontys ICT Eindhoven.',
        images: ['/img/newlogo.png']
    },
    icons: {
        icon: [
            { url: '/img/newlogo.svg', type: 'image/svg+xml' },
        ],
        apple: [
            { url: '/img/newlogo.svg', type: 'image/svg+xml' },
        ]
    }
};

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '600', '700', '900'],
    variable: '--font-poppins'
});

export default async function RootLayout({
    children }: Readonly<{ children: React.ReactNode }>) {
    const h = await headers();
    const nonce = h.get('x-nonce') || '';
    const [session, adminAccess] = await Promise.all([
        getEnrichedSession(),
        checkAdminAccess()
    ]);

    const { impersonation, isAuthorized } = adminAccess;

    return (
        <html lang="nl" className="dark" suppressHydrationWarning>
            <head>
                <script
                    id="theme-strategy"
                    nonce={nonce}
                    suppressHydrationWarning
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{if(localStorage.theme==='light'){document.documentElement.classList.remove('dark')}}catch(_){}})()`
                    }}
                />
                <link rel="preload" as="image" href="/img/newlogo.png" />
                <HeadPreloads />
            </head>
            <body className={`${poppins.variable} antialiased flex flex-col min-h-screen`}>
                <ImpersonationWrapper impersonation={impersonation} />
                <HeaderWrapper initialSession={session} isAuthorized={isAuthorized} />
                <main className="flex-grow min-h-[100dvh] pt-[var(--header-total-height,var(--header-height,80px))]">
                    <LazyMotion features={domMax} strict>{children}</LazyMotion>
                </main>
                <FooterWrapper initialSession={session} />
            </body>
        </html>
    );
}

async function HeadPreloads() {
    await connection();
    try {
        const [banners, activities] = await Promise.all([
            getHeroBanners(),
            getUpcomingActiviteiten(4)
        ]);

        const criticalImages = [
            ...(banners[0]?.afbeelding_id ? [getImageUrl(banners[0].afbeelding_id, { width: 1200, height: 800, fit: 'cover' })] : []),
            ...activities.slice(0, 2).map((a: Activiteit) => a.afbeelding_id ? getImageUrl(a.afbeelding_id, { width: 400, height: 300, fit: 'cover' }) : null).filter(Boolean)
        ];

        return (
            <>
                {criticalImages.map((src, idx) => (
                    <link key={`preload-img-${idx}`} rel="preload" as="image" href={src!} />
                ))}
            </>
        );
    } catch (_error) {
        return null;
    }
}




async function HeaderWrapper({ initialSession, isAuthorized }: { initialSession: ExtendedSession | null, isAuthorized: boolean }) {
    await connection();
    try {
        const disabledRoutes = await getDisabledRoutes();

        return (
            <NavigationHeader
                disabledRoutes={disabledRoutes}
                initialSession={initialSession}
                isAdmin={isAuthorized}
            />
        );
    } catch (_error) {
        return (
            <NavigationHeader
                disabledRoutes={[]}
                initialSession={null}
                isAdmin={false}
            />
        );
    }
}

async function FooterWrapper({ initialSession }: { initialSession: ExtendedSession | null }) {
    await connection();
    try {
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
                initialSession={initialSession}
            />
        );
    } catch (error) {
        console.error('[RootLayout] FooterWrapper fail:', error instanceof Error ? error.message : 'Unknown error');
        return (
            <FooterIsland
                documents={[]}
                disabledRoutes={[]}
                committees={[]}
                initialSession={null}
            />
        );
    }
}

async function ImpersonationWrapper({ impersonation }: { impersonation: ImpersonationInfo | null }) {
    await connection();

    if (!impersonation || !impersonation.targetName) return null;

    return (
        <ImpersonationBanner
            targetName={impersonation.targetName}
            adminName={impersonation.name}
            committees={impersonation.targetCommittees ?? []}
        />
    );
}
