import React from 'react';

import { type EnrichedUser } from '@/types/auth';

interface RegistrationSuccessProps {
    currentUser: EnrichedUser | null;
    email?: string;
}

export function RegistrationSuccess({ currentUser, email }: RegistrationSuccessProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-theme-purple/10 bg-theme-purple/5 px-4 py-10 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-theme-purple/20">
                <svg className="size-8 text-theme-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 className="dark:text-theme-white mb-2 text-2xl font-bold text-theme-purple">Inschrijving Ontvangen!</h2>
            <p className="mb-6 text-(--text-muted)">
                {currentUser 
                    ? 'Bedankt voor je inschrijving. Je status wordt nu bijgewerkt...' 
                    : `Bedankt voor je inschrijving! Check je mail (${email || 'jouw e-mailadres'}) voor de bevestiging.`}
            </p>
        </div>
    );
}
