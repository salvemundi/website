'use client';

import { ReactNode } from 'react';
import { usePWAContext } from '@/shared/contexts/PWAContext';
import BottomNav from '@/shared/components/sections/BottomNav';
import InstallPromptBanner from '@/shared/components/sections/InstallPromptBanner';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const { showBottomNav, showInstallPrompt, installPWA, dismissInstallPrompt } = usePWAContext();

    return (
        <>
            <div className={showBottomNav ? 'pb-20' : ''}>
                {children}
            </div>
            {showBottomNav && <BottomNav />}
            {showInstallPrompt && (
                <InstallPromptBanner
                    onInstall={installPWA}
                    onDismiss={dismissInstallPrompt}
                />
            )}
        </>
    );
}
