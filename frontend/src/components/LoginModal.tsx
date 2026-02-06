'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useAuthActions } from '@/features/auth/providers/auth-provider';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'silent_failed' | 'action_required' | 'page_protected';
    message?: string;
}

/**
 * LoginModal Component
 * Provides popup-based login UI without navigating away from current page
 * 
 * Features:
 * - Popup blocker resistant (loginPopup called synchronously from onClick)
 * - Fallback to redirect if popup is blocked
 * - Three modes: silent_failed, action_required, page_protected
 * - Body scroll lock for mobile UX
 * 
 * CRITICAL: loginPopup is ONLY called from button onClick (direct user gesture)
 * This prevents popup blockers from interfering
 */
export default function LoginModal({
    isOpen,
    onClose,
    mode = 'page_protected',
    message,
}: LoginModalProps) {
    const { loginWithMicrosoft, loginWithRedirect } = useAuthActions();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [popupBlocked, setPopupBlocked] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Lock body scroll when modal is open (prevents background scroll on mobile)
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Mode-specific messaging
    const getModeMessage = () => {
        if (message) return message;

        switch (mode) {
            case 'silent_failed':
                return 'We konden je niet automatisch inloggen. Log opnieuw in om verder te gaan.';
            case 'action_required':
                return 'Deze actie vereist dat je ingelogd bent.';
            case 'page_protected':
            default:
                return 'Deze pagina vereist dat je ingelogd bent.';
        }
    };

    const getModeTitle = () => {
        switch (mode) {
            case 'silent_failed':
                return 'Sessie verlopen';
            case 'action_required':
                return 'Actie vereist login';
            case 'page_protected':
            default:
                return 'Inloggen vereist';
        }
    };

    /**
     * CRITICAL: This handler is called SYNCHRONOUSLY from button onClick
     * This is the ONLY way to prevent popup blockers
     * 
     * DO NOT:
     * - Call from useEffect
     * - Wrap in setTimeout
     * - Call from async callback
     * - Use Promise.resolve().then()
     */
    const handleLoginClick = async () => {
        setIsLoggingIn(true);
        setError(null);
        setPopupBlocked(false);

        try {
            // CRITICAL: Call loginPopup synchronously from user click event
            // This is executed directly in the call stack of the onClick event
            await loginWithMicrosoft();

            // Success: modal will close via onClose or auth state change
            onClose();
        } catch (err: any) {
            console.error('[LoginModal] Login error:', err);

            // Detect popup blocker
            // MSAL throws specific errors when popup is blocked
            const isPopupError =
                err.errorCode === 'popup_window_error' ||
                err.errorCode === 'user_cancelled' ||
                err.message?.toLowerCase().includes('popup') ||
                err.message?.toLowerCase().includes('blocked');

            if (isPopupError) {
                setPopupBlocked(true);
                setError('De popup werd geblokkeerd door je browser');
            } else {
                setError(err.message || 'Er is een fout opgetreden bij het inloggen');
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    /**
     * Fallback: Redirect-based login
     * Only shown when popup is blocked
     * Saves current URL in sessionStorage (not localStorage)
     */
    const handleRedirectLogin = () => {
        // Use the provider's redirect method which handles return URL storage correctly
        if (typeof window !== 'undefined') {
            loginWithRedirect(window.location.pathname + window.location.search);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-labelledby="login-modal-title"
            aria-modal="true"
            onClick={(e) => {
                // Close on backdrop click
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 transform transition-all animate-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Sluiten"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-theme flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h2
                    id="login-modal-title"
                    className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3"
                >
                    {getModeTitle()}
                </h2>

                {/* Message */}
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                    {getModeMessage()}
                </p>

                {/* Error message */}
                {error && !popupBlocked && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Popup Blocked Warning */}
                {popupBlocked && (
                    <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start gap-2 mb-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">
                                    Popup geblokkeerd
                                </p>
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                    Je browser heeft de login popup geblokkeerd. Je kunt:
                                </p>
                            </div>
                        </div>
                        <ul className="text-sm text-amber-700 dark:text-amber-400 ml-7 space-y-1">
                            <li>1. Popups toestaan voor deze site en opnieuw proberen</li>
                            <li>2. Of gebruik de redirect login optie hieronder</li>
                        </ul>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    {/* Primary: Popup Login */}
                    <button
                        onClick={handleLoginClick}
                        disabled={isLoggingIn}
                        className="w-full px-6 py-3 bg-gradient-theme text-white font-semibold rounded-full hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {isLoggingIn ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Bezig met inloggen...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5v-11l8 5.5-8 5.5z" />
                                </svg>
                                <span>Inloggen met Microsoft</span>
                            </>
                        )}
                    </button>

                    {/* Fallback: Redirect Login (only shown when popup blocked) */}
                    {popupBlocked && (
                        <button
                            onClick={handleRedirectLogin}
                            className="w-full px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 font-semibold rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                        >
                            Gebruik redirect login
                        </button>
                    )}

                    {/* Info text */}
                    <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                        {popupBlocked
                            ? 'De redirect brengt je terug naar deze pagina na het inloggen'
                            : 'Je blijft op deze pagina tijdens het inloggen'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}
