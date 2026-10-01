'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function StatusDeadlinePassed() {
    return (
        <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-3xl border border-dashed border-border-color/60 bg-bg-soft/50 p-8 text-center sm:p-12 dark:bg-bg-soft/20">
            <div className="flex size-12 items-center justify-center rounded-full border border-theme-purple/10 bg-theme-purple/5 text-theme-purple/60">
                <AlertCircle className="size-6" />
            </div>
            <div>
                <h3 className="text-lg font-bold tracking-tight text-text-main sm:text-xl">
                    De inschrijvingen staan dicht
                </h3>
                <p className="mx-auto mt-2 max-w-70 text-xs leading-relaxed font-medium text-text-muted sm:text-sm">
                    Als er een update is kan je die volgen via de WhatsApp announcements.
                </p>
            </div>
        </div>
    );
}
