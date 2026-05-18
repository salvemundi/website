'use client';

import { useEffect, useState, useCallback } from 'react';

import ToastWrapper from './pwa/ToastWrapper';
import NativeToast from './pwa/NativeToast';
import IosToast from './pwa/IosToast';
import { safeConsoleError } from '@/server/utils/logger';

const DISMISSED_KEY = 'pwa_install_dismissed_until';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Mode = 'native' | 'ios';

function detectIos(): boolean {
    const ua = navigator.userAgent;
    const isIpadOs = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
    return /iphone|ipad|ipod/i.test(ua) || isIpadOs;
}

function detectIosSafari(): boolean {
    const ua = navigator.userAgent;
    const isIos = detectIos();
    const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|EdgiOS/i.test(ua);
    return isIos && isSafari;
}

function isDismissed(): boolean {
    try {
        const val = localStorage.getItem(DISMISSED_KEY);
        return !!val && Date.now() < parseInt(val, 10);
    } catch (error) {
        safeConsoleError('[PwaInstallToast][isDismissed] Fout bij het uitlezen van localStorage', error);
        return false;
    }
}

function isStandalone(): boolean {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
    return false;
}

export function PwaInstallToast() {
    const [show, setShow] = useState(false);
    const [mode, setMode] = useState<Mode>('native');
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        if (isStandalone()) return;
        if (isDismissed()) return;

        if (detectIosSafari()) {
            setMode('ios');
            setTimeout(() => setShow(true), 2500);
            return;
        }

        if (detectIos()) {
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setMode('native');
            setTimeout(() => setShow(true), 2500);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = useCallback(() => {
        const performInstall = async () => {
            if (!deferredPrompt) return;
            setInstalling(true);
            try {
                await deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    setShow(false);
                } else {
                    setInstalling(false);
                }
            } finally {
                setDeferredPrompt(null);
            }
        };
        void performInstall();
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setShow(false);
        try {
            localStorage.setItem(DISMISSED_KEY, String(Date.now() + DISMISS_DURATION_MS));
        } catch (error) {
            safeConsoleError('[PwaInstallToast][handleDismiss] Kon dismissed state niet opslaan in localStorage', error);
        }
    }, []);

    if (!show) return null;

    return (
        <ToastWrapper visible={show}>
            {mode === 'ios' ? (
                <IosToast onDismiss={handleDismiss} />
            ) : (
                <NativeToast onInstall={handleInstall} onDismiss={handleDismiss} installing={installing} />
            )}
        </ToastWrapper>
    );
}