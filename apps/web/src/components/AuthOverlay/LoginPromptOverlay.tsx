'use client';

import { useAuthActions } from '@/features/auth/providers/auth-provider';

interface LoginPromptOverlayProps {
    message?: string;
    onLoginClick?: () => void;
}

/**
 * LoginPromptOverlay Component
 * Displayed when a user needs to log in to access content
 * Triggers a redirect login flow (User preference: reliability over popup windows)
 */
export default function LoginPromptOverlay({
    message = 'Deze pagina vereist dat je ingelogd bent',
    onLoginClick,
}: LoginPromptOverlayProps) {
    const { loginWithMicrosoft } = useAuthActions();

    const handleLoginClick = () => {
        if (onLoginClick) {
            onLoginClick();
        } else {
            // Directly trigger redirect login
            loginWithMicrosoft();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            role="dialog"
            aria-labelledby="login-prompt-title"
            aria-modal="true"
        >
            <div className="relative w-full max-w-md mx-4 bg-theme-white dark:bg-surface-dark rounded-2xl shadow-card-elevated p-6 sm:p-8 transform transition-all border border-theme-purple/10 dark:border-white/5">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-theme flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
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
                    id="login-prompt-title"
                    className="text-2xl font-bold text-center text-theme-text dark:text-white mb-3"
                >
                    Inloggen vereist
                </h2>

                {/* Message */}
                <p className="text-center text-theme-text-muted dark:text-theme-text-light mb-6">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleLoginClick}
                        className="w-full px-6 py-3 bg-gradient-theme text-white font-semibold rounded-full hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                        Inloggen met Microsoft
                    </button>

                    <p className="text-center text-sm text-theme-text-muted dark:text-theme-text-light">
                        Je wordt na het inloggen teruggestuurd naar deze pagina
                    </p>
                </div>
            </div>
        </div>
    );
}
