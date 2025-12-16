'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PWAContextType {
    showBottomNav: boolean;
    showInstallPrompt: boolean;
    installPWA: () => void;
    dismissInstallPrompt: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: ReactNode }) {
    const [showBottomNav, setShowBottomNav] = useState(false);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // Check if mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        setShowBottomNav(isMobile);

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Check if user has dismissed the prompt before
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed && isMobile) {
                setShowInstallPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const installPWA = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            // user accepted install prompt (log removed)
        }

        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const dismissInstallPrompt = () => {
        setShowInstallPrompt(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    return (
        <PWAContext.Provider value={{ showBottomNav, showInstallPrompt, installPWA, dismissInstallPrompt }}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWAContext() {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error('usePWAContext must be used within a PWAProvider');
    }
    return context;
}
