import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import { connection } from 'next/server';
import localFont from 'next/font/local';

import { Box, mantineHtmlProps } from '@mantine/core';
import { MantineAppProvider } from '@/components/providers/MantineAppProvider';
import { BRAND_COLORS } from '@/lib/config/theme';
import './globals.css';

import type { ExtendedSession, ImpersonationInfo } from '@/types/auth';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { checkBeheerAccess } from '@/server/actions/beheer/beheer-utils.actions';
import { getDocumenten, getDisabledRoutes } from '@/server/actions/public/website.actions';
import { getCommittees } from '@/server/actions/public/committees.actions';
import { safeConsoleError } from '@/server/utils/logger';

import NavigationHeader from '@/components/islands/layout/NavigationHeader';
import ImpersonationBanner from '@/components/ui/beheer/ImpersonationBanner';

const FooterIsland = dynamic(() => import('@/components/islands/layout/FooterIsland'));

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: BRAND_COLORS.lightSurface },
        { media: '(prefers-color-scheme: dark)', color: BRAND_COLORS.darkBase },
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
    icons: {
        icon: [
            {
                url: '/favicon-light.png',
                type: 'image/png',
                sizes: '64x64',
                media: '(prefers-color-scheme: light)',
            },
            {
                url: '/favicon-dark.png',
                type: 'image/png',
                sizes: '64x64',
                media: '(prefers-color-scheme: dark)',
            },
            {
                url: '/favicon.svg',
                type: 'image/svg+xml',
                sizes: 'any',
            },
        ],
        apple: [
            {
                url: '/img/icons/apple-icon-180.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    },
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

const poppins = localFont({
    variable: '--font-poppins',
    src: [
        { path: '../../public/fonts/poppins/Poppins-Thin.ttf', weight: '100', style: 'normal' },
        { path: '../../public/fonts/poppins/Poppins-ThinItalic.ttf', weight: '100', style: 'italic' },
        { path: '../../public/fonts/poppins/Poppins-ExtraLight.ttf', weight: '200', style: 'normal' },
        { path: '../../public/fonts/poppins/Poppins-ExtraLightItalic.ttf', weight: '200', style: 'italic' },
        { path: '../../public/fonts/poppins/Poppins-Light.ttf', weight: '300', style: 'normal' },
        { path: '../../public/fonts/poppins/Poppins-LightItalic.ttf', weight: '300', style: 'italic' },
        { path: '../../public/fonts/poppins/Poppins-Regular.ttf', weight: '400', style: 'normal' },
        { path: '../../public/fonts/poppins/Poppins-Italic.ttf', weight: '400', style: 'italic' },
        { path: '../../public/fonts/poppins/Poppins-Medium.ttf', weight: '500', style: 'normal' },
        { path: '../../public/fonts/poppins/Poppins-MediumItalic.ttf', weight: '500', style: 'italic' },
        { path: '../../public/fonts/poppins/Poppins-SemiBold.ttf', weight: '600', style: 'normal' },
        { path: '../../public/fonts/poppins/Poppins-SemiBoldItalic.ttf', weight: '600', style: 'italic' },
        { path: '../../public/fonts/poppins/Poppins-Bold.ttf', weight: '700', style: 'normal' },
        { path: '../../public/fonts/poppins/Poppins-BoldItalic.ttf', weight: '700', style: 'italic' },
        { path: '../../public/fonts/poppins/Poppins-ExtraBold.ttf', weight: '800', style: 'normal' },
        { path: '../../public/fonts/poppins/Poppins-ExtraBoldItalic.ttf', weight: '800', style: 'italic' },
        { path: '../../public/fonts/poppins/Poppins-Black.ttf', weight: '900', style: 'normal' },
        { path: '../../public/fonts/poppins/Poppins-BlackItalic.ttf', weight: '900', style: 'italic' },
    ],
});

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    const session = await getEnrichedSession();
    const adminAccess = await checkBeheerAccess();

    const { impersonation, isAuthorized } = adminAccess;

    return (
        <html lang="nl" {...mantineHtmlProps} data-mantine-color-scheme="dark">
            <body className={`${poppins.variable} flex min-h-screen flex-col font-sans antialiased`}>
                <MantineAppProvider>
                    <ImpersonationWrapper impersonation={impersonation} />
                    <HeaderWrapper initialSession={session} isAuthorized={isAuthorized} />
                    <Box
                        component="main"
                        style={{
                            display: 'flex',
                            flexGrow: 1,
                            flexDirection: 'column',
                            paddingTop: 'calc(var(--header-total-height, 80px) + env(safe-area-inset-top, 0px))',
                        }}
                    >
                        {children}
                        <FooterWrapper initialSession={session} />
                    </Box>
                </MantineAppProvider>
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
            canAccessAdmin={isAuthorized}
        />
    );
}

async function FooterWrapper({ initialSession }: { initialSession: ExtendedSession | null }) {
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
        <Box mt="auto" w="100%">
            <FooterIsland
                documents={documents}
                disabledRoutes={disabledRoutes}
                committees={committees}
                initialSession={initialSession}
            />
        </Box>
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