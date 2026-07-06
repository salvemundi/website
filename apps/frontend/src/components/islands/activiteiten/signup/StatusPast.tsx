'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function StatusPast() {
    return (
        <div className="h-full flex flex-col justify-center items-center p-8 sm:p-12 rounded-3xl bg-bg-soft/50 dark:bg-bg-soft/20 border border-dashed border-border-color/60 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-text-muted/5 flex items-center justify-center text-text-muted/60 border border-text-muted/10">
                <AlertCircle className="h-6 w-6" />
            </div>
            <div>
                <h3 className="text-lg sm:text-xl font-bold text-text-main tracking-tight">
                    Activiteit Afgelopen
                </h3>
                <p className="text-xs sm:text-sm font-medium text-text-muted max-w-[280px] mx-auto mt-2 leading-relaxed">
                    Helaas kun je je voor deze activiteit niet meer aanmelden.
                </p>
            </div>
        </div>
    );
}
