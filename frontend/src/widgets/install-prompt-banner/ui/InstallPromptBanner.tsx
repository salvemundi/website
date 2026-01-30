'use client';

import { X } from 'lucide-react';

interface InstallPromptBannerProps {
    onInstall: () => void;
    onDismiss: () => void;
}

export default function InstallPromptBanner({ onInstall: handleInstall, onDismiss: handleDismiss }: InstallPromptBannerProps) {
    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
            <div className="rounded-2xl bg-white/95 dark:bg-[#1f1921] p-4 shadow-xl backdrop-blur-lg">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <img
                            src="/img/Logo.png"
                            alt="Salve Mundi"
                            className="h-12 w-12 rounded-xl object-contain bg-white p-1"
                        />
                    </div>
                    <div className="flex-grow min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                            Installeer onze app
                        </h3>
                        <p className="mt-1 text-xs text-slate-600 dark:text-white/70">
                            Voeg Salve Mundi toe aan je scherm voor een nog betere ervaring
                        </p>
                        <div className="mt-3 flex gap-2">
                            <button
                                onClick={handleInstall}
                                className="rounded-full bg-gradient-to-r from-oranje to-paars px-4 py-2 text-xs font-semibold text-white transition hover:shadow-lg"
                            >
                                Installeren
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="rounded-full bg-white dark:bg-white/10 px-4 py-2 text-xs font-semibold text-oranje transition hover:bg-oranje/5"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60"
                        aria-label="Sluiten"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
