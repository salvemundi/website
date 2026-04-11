import React from 'react';
import { Clock, Lock } from 'lucide-react';

interface RegistrationClosedProps {
    registrationStartText: string;
}

export function RegistrationClosed({ registrationStartText }: RegistrationClosedProps) {
    const isWaitingForDate = registrationStartText.includes('opent op');
    
    return (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center bg-theme-purple/5 rounded-2xl border border-[var(--border-color)]/20 animate-in fade-in duration-700">
            <div className="w-12 h-12 bg-theme-purple/10 rounded-full flex items-center justify-center mb-4 text-theme-purple opacity-60">
                {isWaitingForDate ? <Clock className="w-6 h-6 animate-pulse" /> : <Lock className="w-6 h-6" />}
            </div>
            <h3 className="text-lg font-bold text-[var(--text-main)] dark:text-gray-300 mb-1">
                {isWaitingForDate ? 'Binnenkort Open' : 'Inschrijving Gesloten'}
            </h3>
            <p className="text-[var(--text-muted)] text-sm max-w-xs">
                {registrationStartText}
            </p>
        </div>
    );
}
