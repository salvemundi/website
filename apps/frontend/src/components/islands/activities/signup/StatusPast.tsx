'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function StatusPast() {
    return (
        <div className="h-full flex flex-col justify-center items-center p-12 rounded-[2.5rem] bg-[var(--bg-soft)]/50 border border-dashed border-[var(--border-color)] text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-[var(--text-muted)] opacity-20" />
            <div>
                <h3 className="text-xl font-semibold text-[var(--text-muted)] opacity-40  tracking-widest italic">Activiteit Afgelopen</h3>
                <p className="text-xs text-[var(--text-muted)] opacity-30 font-bold  tracking-tight max-w-[200px] mx-auto mt-2">Helaas kun je je voor deze activiteit niet meer aanmelden.</p>
            </div>
        </div>
    );
}
