'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import BackButton from '@/components/ui/navigation/BackButton';

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
    title?: string;
}

export default function GlobalError({ 
    error, 
    reset, 
    title = "Er is iets misgegaan" 
}: GlobalErrorProps) {
    useEffect(() => {
        // Log the error to an error reporting service if available
        
    }, [error]);

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
            <div className="relative mb-8">
                <div className="absolute inset-x-0 top-0 h-40 w-40 mx-auto blur-3xl bg-[var(--color-purple-500)]/10 rounded-full pointer-events-none" />
                <div className="relative rounded-3xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border-color)]/20 text-[var(--color-purple-500)]">
                    <AlertTriangle className="h-16 w-16" />
                </div>
            </div>

            <h2 className="text-3xl font-black text-[var(--text-main)] mb-3">
                {title}
            </h2>
            
            <p className="text-[var(--text-muted)] max-w-md mx-auto mb-8">
                {error.message || "Onze servers konden het verzoek niet verwerken. Probeer het opnieuw of ga terug naar de homepagina."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <button
                    onClick={() => reset()}
                    className="flex items-center gap-2 rounded-full bg-[var(--color-purple-500)] text-white px-8 py-3.5 font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Opnieuw Proberen
                </button>

                <BackButton 
                    href="/" 
                    text="Terug naar Home" 
                    icon={Home} 
                    className="rounded-full px-8 py-3.5"
                />
            </div>

            {error.digest && (
                <p className="mt-8 text-xs font-mono text-[var(--text-muted)] opacity-50 uppercase tracking-widest">
                    Err-ID: {error.digest}
                </p>
            )}
        </div>
    );
}
