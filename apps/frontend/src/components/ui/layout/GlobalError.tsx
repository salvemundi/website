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
                <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto size-40 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="squircle-lg relative border border-(--border-color)/20 bg-(--bg-card) p-6 text-purple-500 shadow-2xl">
                    <AlertTriangle className="size-16" />
                </div>
            </div>

            <h2 className="mb-3 text-3xl font-black text-(--text-main)">
                {title}
            </h2>
            
            <p className="mx-auto mb-8 max-w-md text-(--text-muted)">
                {error.message || "Onze servers konden het verzoek niet verwerken. Probeer het opnieuw of ga terug naar de homepagina."}
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                    onClick={() => reset()}
                    className="squircle flex items-center gap-2 bg-purple-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5 hover:shadow-purple-500/40"
                >
                    <RefreshCcw className="size-4" />
                    Opnieuw Proberen
                </button>

                <BackButton 
                    href="/" 
                    text="Terug naar Home" 
                    icon={Home} 
                    className="squircle px-8 py-3.5"
                />
            </div>

            {error.digest && (
                <p className="mt-8 font-mono text-xs tracking-widest text-(--text-muted) uppercase opacity-50">
                    Err-ID: {error.digest}
                </p>
            )}
        </div>
    );
}
