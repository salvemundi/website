'use client';

import { ReactNode } from 'react';
import { usePWAContext } from '@/features/pwa/lib/PWAContext';
import BottomNav from '@/widgets/bottom-nav/ui/BottomNav';
import InstallPromptBanner from '@/widgets/install-prompt-banner/ui/InstallPromptBanner';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const { showBottomNav, showInstallPrompt, installPWA, dismissInstallPrompt } = usePWAContext();

    return (
        <>
            {children}
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
