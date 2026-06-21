import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import { headers } from 'next/headers';
import { connection } from 'next/server';
import { Poppins } from 'next/font/google';

import './globals.css';

import type { ExtendedSession, ImpersonationInfo } from '@/types/auth';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import { getDocumenten, getDisabledRoutes } from '@/server/actions/public/website.actions';
import { getCommittees } from '@/server/actions/public/committees.actions';
import { safeConsoleError } from '@/server/utils/logger';

import NavigationHeader from '@/components/islands/layout/NavigationHeader';
import ImpersonationBanner from '@/components/ui/admin/ImpersonationBanner';

const FooterIsland = dynamic(() => import('@/components/islands/layout/FooterIsland'));

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
        default: 'Salve Mundi | Studievereniging Fontys ICT',
        template: '%s | Salve Mundi'
    },
    description: 'Salve Mundi is de studievereniging voor Fontys ICT in Eindhoven. Ontdek onze activiteiten, commissies en word lid!',
    keywords: ['Fontys ICT', 'Studievereniging', 'Eindhoven', 'Salve Mundi', 'Studenten'],
    authors: [{ name: 'Salve Mundi ICT Commissie' }],
    creator: 'Salve Mundi',
    publisher: 'Salve Mundi',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Salve Mundi'
    },
    openGraph: {
        type: 'website',
        locale: 'nl_NL',
        url: 'https://salvemundi.nl',
        siteName: 'Salve Mundi',
        title: 'Salve Mundi | Studievereniging Fontys ICT',
        description: 'Salve Mundi is de studievereniging voor Fontys ICT in Eindhoven. Ontdek onze activiteiten, commissies en word lid!',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Salve Mundi | Studievereniging Fontys ICT',
        description: 'De officiële studievereniging van Fontys ICT Eindhoven.',
    }
};

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '900'],
    variable: '--font-poppins'
});

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
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
            </head>
            <body className={`${poppins.variable} font-sans antialiased flex flex-col min-h-screen`}>
                <ImpersonationWrapper impersonation={impersonation} />
                <HeaderWrapper initialSession={session} isAuthorized={isAuthorized} />
                <main className="grow flex flex-col pt-header-total">
                    {children}
                    <FooterWrapper initialSession={session} className="mt-auto w-full" />
                </main>
            </body>
        </html>
    );
}

async function HeaderWrapper({ initialSession, isAuthorized }: { initialSession: ExtendedSession | null, isAuthorized: boolean }) {
    await connection();
    let disabledRoutes: string[] = [];
    try {
        disabledRoutes = await getDisabledRoutes();
    } catch (error) {
        safeConsoleError('[layout.tsx][HeaderWrapper] ', error);
        initialSession = null;
        isAuthorized = false;
    }

    return (
        <NavigationHeader
            disabledRoutes={disabledRoutes}
            initialSession={initialSession}
            isAdmin={isAuthorized}
        />
    );
}

async function FooterWrapper({ initialSession, className }: { initialSession: ExtendedSession | null; className?: string }) {
    await connection();
    let documents: Awaited<ReturnType<typeof getDocumenten>> = [];
    let disabledRoutes: string[] = [];
    let committees: Awaited<ReturnType<typeof getCommittees>> = [];
    
    try {
        const results = await Promise.all([
            getDocumenten(),
            getDisabledRoutes(),
            getCommittees(),
        ]);
        documents = results[0];
        disabledRoutes = results[1];
        committees = results[2];
    } catch (error) {
        safeConsoleError('[layout.tsx][FooterWrapper] ', error);
    }

    return (
        <div className={className}>
            <FooterIsland
                documents={documents}
                disabledRoutes={disabledRoutes}
                committees={committees}
                initialSession={initialSession}
            />
        </div>
    );
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
