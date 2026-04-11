import React from 'react';

interface RegistrationSuccessProps {
    currentUser: any;
    onReset?: () => void;
}

export function RegistrationSuccess({ currentUser, onReset }: RegistrationSuccessProps) {
    return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-theme-purple/5 rounded-2xl border border-theme-purple/10">
            <div className="w-16 h-16 bg-theme-purple/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-theme-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-theme-purple dark:text-theme-white mb-2">Inschrijving Ontvangen!</h2>
            <p className="text-[var(--text-muted)] mb-6">
                {currentUser 
                    ? 'Bedankt voor je inschrijving. Je status wordt nu bijgewerkt...' 
                    : 'Bedankt voor je inschrijving! Check je mail voor de bevestiging.'}
            </p>
            {!currentUser && onReset && (
                <button 
                    onClick={onReset}
                    className="text-sm font-semibold text-theme-purple hover:underline"
                >
                    Nog iemand inschrijven?
                </button>
            )}
        </div>
    );
}
