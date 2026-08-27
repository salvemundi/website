'use client';

import React from 'react';
import { Users } from 'lucide-react';

export default function StatusFull() {
    return (
        <div className="h-full flex flex-col justify-center items-center p-8 sm:p-12 rounded-3xl bg-bg-soft/50 dark:bg-bg-soft/20 border border-dashed border-border-color/60 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-text-muted/5 flex items-center justify-center text-text-muted/60 border border-text-muted/10">
                <Users className="h-6 w-6" />
            </div>
            <div>
                <h3 className="text-lg sm:text-xl font-bold text-text-main tracking-tight">
                    Deze activiteit zit vol
                </h3>
                <p className="text-xs sm:text-sm font-medium text-text-muted max-w-[280px] mx-auto mt-2 leading-relaxed">
                    Het maximum aantal aanmeldingen is bereikt. Aanmelden is helaas niet meer mogelijk.
                </p>
            </div>
        </div>
    );
}
