import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import NavigationHeader from '@/components/islands/layout/NavigationHeader';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const FooterIsland = dynamic(() => import('@/components/islands/layout/FooterIsland'));

import ImpersonationBanner from '@/components/ui/admin/ImpersonationBanner';
import { getDocumenten, getDisabledRoutes } from '@/server/actions/public/website.actions';
import { getCommittees } from '@/server/actions/public/committees.actions';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import { headers } from 'next/headers';
import { connection } from 'next/server';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { type ExtendedSession, type ImpersonationInfo } from '@/types/auth';
import { domMax, LazyMotion } from 'framer-motion';
import { safeConsoleError } from '@/server/utils/logger';

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
    },
    twitter: {
        card: 'summary_large_image',
        title: 'SV Salve Mundi | Studievereniging Fontys ICT',
        description: 'De officiële studievereniging van Fontys ICT Eindhoven.',
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
    weight: ['400', '500', '600', '700', '900'],
    variable: '--font-poppins'
});

export default async function RootLayout({
    children }: Readonly<{ children: ReactNode }>) {
    const h = await headers();
    const nonce = h.get('x-nonce') || '';
    const session = await getEnrichedSession();
    const adminAccess = await checkAdminAccess();

    const { impersonation, isAuthorized } = adminAccess;

    return (
        <html lang="nl" className="dark" suppressHydrationWarning>
            <head>
                <script id="theme-strategy" nonce={nonce} suppressHydrationWarning>{`
                    (function(){
                        try {
                            if(localStorage.theme === 'light'){
                                document.documentElement.classList.remove('dark');
                            }
                        } catch(e) {}
                    })()
                `}</script>
                <link rel="preload" as="image" href="/img/newlogo.svg" />
            </head>
            <body className={`${poppins.variable} font-sans antialiased flex flex-col min-h-screen`}>
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
    } catch (error) {
        // 🚀 FIX: Context prefixing gecorrigeerd naar exact [bestandsnaam][functienaam] conform PROJECT_STATUS.md
        safeConsoleError('[layout][HeaderWrapper]', error);
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
        safeConsoleError('[layout][FooterWrapper]', error);
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