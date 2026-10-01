'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function StatusPast() {
    return (
        <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-3xl border border-dashed border-border-color/60 bg-bg-soft/50 p-8 text-center sm:p-12 dark:bg-bg-soft/20">
            <div className="flex size-12 items-center justify-center rounded-full border border-text-muted/10 bg-text-muted/5 text-text-muted/60">
                <AlertCircle className="size-6" />
            </div>
            <div>
                <h3 className="text-lg font-bold tracking-tight text-text-main sm:text-xl">
                    Activiteit Afgelopen
                </h3>
                <p className="mx-auto mt-2 max-w-70 text-xs leading-relaxed font-medium text-text-muted sm:text-sm">
                    Helaas kun je je voor deze activiteit niet meer aanmelden.
                </p>
            </div>
        </div>
    );
}
