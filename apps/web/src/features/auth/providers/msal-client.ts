'use client';

import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '@/shared/config/msalConfig';

/**
 * Detect if we are running inside a popup or iframe used for authentication
 */
export const isInternalAuthWindow = () => {
    if (typeof window === 'undefined') return false;

    // Check if we have auth artifacts in URL - this strongly indicates a popup/redirect return
    const url = new URL(window.location.href);
    const hasAuthArtifacts = url.hash.includes('code=') || url.hash.includes('error=') ||
        url.searchParams.has('code') || url.searchParams.has('state');

    try {
        // More robust detection: if we have an opener or parent and auth artifacts,
        // we are almost certainly the authentication window that should not run app logic.
        if (window.opener && window.opener !== window && hasAuthArtifacts) return true;
        if (window.parent && window.parent !== window && hasAuthArtifacts) return true;

        // Classic checks as fallback
        if (window.opener && window.opener !== window) return true;
        if (window.parent && window.parent !== window) return true;
    } catch (e) {
        // Cross-origin access error usually means we are in a popup/iframe from Microsoft
        return true;
    }
    return false;
};

// Internal reference to the singleton instance
let msalInstance: PublicClientApplication | null = null;
let isInitializing = false;
let initPromise: Promise<PublicClientApplication | null> | null = null;

/**
 * Gets or initializes the MSAL instance client-side only to avoid SSR mismatches.
 * Returns a promise that resolves to the instance or null if initialization fails/is disabled.
 */
export const getMsalInstance = async (): Promise<PublicClientApplication | null> => {
    // If we already have the instance initialized, return it
    if (msalInstance) {
        return msalInstance;
    }

    // SSR check
    if (typeof window === 'undefined') {
        return null;
    }

    // If already initializing, wait for that promise to resolve
    if (initPromise) {
        return initPromise;
    }

    isInitializing = true;
    initPromise = (async () => {
        try {
            const clientId = msalConfig.auth.clientId;
            if (clientId && clientId !== 'YOUR_CLIENT_ID') {
                const instance = new PublicClientApplication(msalConfig);
                await instance.initialize(); // Required in MSAL v3+
                msalInstance = instance;
                return instance;
            } else {
                console.warn('[MSAL Client] Client ID is missing or invalid. Authentication will be disabled.');
                return null;
            }
        } catch (error) {
            console.error('[MSAL Client] Initialization failed:', error);
            return null;
        } finally {
            isInitializing = false;
        }
    })();

    return initPromise;
};
