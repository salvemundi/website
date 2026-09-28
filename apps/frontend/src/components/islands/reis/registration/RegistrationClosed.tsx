import React from 'react';
import { Clock, Lock } from 'lucide-react';

interface RegistrationClosedProps {
    registrationStartText: string;
}

export function RegistrationClosed({ registrationStartText }: RegistrationClosedProps) {
    const isWaitingForDate = registrationStartText.includes('opent op');
    
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-(--border-color)/20 bg-theme-purple/5 px-6 py-10 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-theme-purple/10 text-theme-purple opacity-60">
                {isWaitingForDate ? <Clock className="size-6" /> : <Lock className="size-6" />}
            </div>
            <h3 className="mb-1 text-lg font-bold text-(--text-main) dark:text-gray-300">
                {isWaitingForDate ? 'Binnenkort Open' : 'Inschrijving Gesloten'}
            </h3>
            <p className="max-w-xs text-sm text-(--text-muted)">
                {registrationStartText}
            </p>
        </div>
    );
}
