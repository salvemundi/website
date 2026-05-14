'use client';

import { Home, Search, ArrowLeft } from 'lucide-react';
import BackButton from '@/components/ui/navigation/BackButton';

export default function NotFound() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            {/* Header with Icon Box matching GlobalError */}
            <div className="relative mb-8 pt-10">
                {/* Decorative background glow */}
                <div className="absolute inset-x-0 top-0 h-40 w-40 mx-auto blur-3xl bg-[var(--color-purple-500)]/10 rounded-full pointer-events-none" />
                
                {/* Icon Container */}
                <div className="relative rounded-3xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border-color)]/20 text-[var(--color-purple-500)] inline-block">
                    <Search className="h-16 w-16" />
                </div>
                
                {/* Faded 404 text behind the icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 select-none">
                    <span className="text-9xl font-black tracking-tighter text-[var(--color-purple-500)]/5">404</span>
                </div>
            </div>

            <h2 className="text-4xl font-black text-[var(--text-main)] mb-3 tracking-tight">
                Pagina niet gevonden
            </h2>
            
            <p className="text-[var(--text-muted)] max-w-md mx-auto mb-10 font-medium">
                Oeps! De pagina die je zoekt lijkt te zijn verhuisd of bestaat niet meer. Geen probleem, we helpen je graag terug.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <BackButton 
                    href="/" 
                    text="Terug naar Home" 
                    icon={Home} 
                    className="rounded-full px-8 py-3.5"
                />

                <BackButton 
                    onClick={() => window.history.back()} 
                    text="Vorige Pagina" 
                    icon={ArrowLeft} 
                    className="rounded-full px-8 py-3.5"
                />
            </div>
        </div>
    );
}
