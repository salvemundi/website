'use client';

import { useEffect } from 'react';
import { ShieldX, Home, User, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NoAccessOverlayProps {
    requiredRoles?: string[];
    onDismiss?: () => void;
    dismissable?: boolean;
    message?: string;
}

/**
 * NoAccessOverlay Component
 * Displayed when a user doesn't have sufficient permissions
 * Shows access denied message without navigating away
 */
export default function NoAccessOverlay({
    requiredRoles = [],
    onDismiss,
    dismissable = false,
    message,
}: NoAccessOverlayProps) {
    const router = useRouter();

    // Lock body scroll when overlay is shown
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const defaultMessage = requiredRoles.length > 0
        ? `Deze pagina is alleen toegankelijk voor gebruikers met de rol${requiredRoles.length > 1 ? 'len' : ''}: ${requiredRoles.join(', ')}`
        : 'Je hebt geen toegang tot deze pagina';

    const handleGoHome = () => {
        router.push('/');
    };

    const handleGoAccount = () => {
        router.push('/account');
    };

    const handleRequestAccess = () => {
        // Navigate to contact or support page
        router.push('/contact');
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            role="dialog"
            aria-labelledby="no-access-title"
            aria-modal="true"
        >
            <div className="relative w-full max-w-md mx-4 bg-theme-white dark:bg-surface-dark rounded-2xl shadow-card-elevated p-6 sm:p-8 transform transition-all border border-theme-purple/10 dark:border-white/5">
                {/* Close button */}
                {dismissable && onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="absolute top-4 right-4 p-2 text-theme-text-muted hover:text-theme-text dark:hover:text-white transition-colors"
                        aria-label="Sluiten"
                    >
                        <ShieldX className="w-5 h-5" />
                    </button>
                )}

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <ShieldX className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                </div>

                {/* Title */}
                <h2
                    id="no-access-title"
                    className="text-2xl font-bold text-center text-theme-text dark:text-white mb-3"
                >
                    Geen toegang
                </h2>

                {/* Message */}
                <p className="text-center text-theme-text-muted dark:text-theme-text-light mb-6">
                    {message || defaultMessage}
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleGoAccount}
                        className="w-full px-6 py-3 bg-gradient-theme text-white font-semibold rounded-full hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <User className="w-5 h-5" />
                        Ga naar je account
                    </button>

                    <button
                        onClick={handleRequestAccess}
                        className="w-full px-6 py-3 bg-theme-white dark:bg-white/5 text-theme-text dark:text-theme-text-light border border-theme-purple/20 dark:border-white/10 font-semibold rounded-full hover:bg-theme-purple/5 dark:hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <Mail className="w-5 h-5" />
                        Vraag toegang aan
                    </button>

                    <button
                        onClick={handleGoHome}
                        className="w-full px-6 py-3 text-theme-text-muted hover:text-theme-text dark:text-theme-text-light dark:hover:text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Terug naar home
                    </button>
                </div>

                {dismissable && (
                    <p className="text-center text-sm text-theme-text-muted dark:text-theme-text-light/70 mt-4">
                        Je kunt deze melding sluiten om op de pagina te blijven
                    </p>
                )}
            </div>
        </div>
    );
}
