'use client';

import { Download, X } from 'lucide-react';

interface InstallPromptBannerProps {
    onInstall: () => void;
    onDismiss: () => void;
}

export default function InstallPromptBanner({ onInstall, onDismiss }: InstallPromptBannerProps) {
    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
            <div className="rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-lg">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-oranje to-paars">
                            <Download className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900">
                            Installeer Salve Mundi App
                        </h3>
                        <p className="mt-1 text-xs text-slate-600">
                            Voeg deze site toe aan je startscherm voor snelle toegang en een betere ervaring.
                        </p>
                        <div className="mt-3 flex gap-2">
                            <button
                                onClick={onInstall}
                                className="rounded-full bg-gradient-to-r from-oranje to-paars px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
                            >
                                Installeer
                            </button>
                            <button
                                onClick={onDismiss}
                                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-oranje transition hover:bg-oranje/5"
                            >
                                Niet nu
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="flex-shrink-0 text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
