'use client';

import { Home, Search, ArrowLeft } from 'lucide-react';
import BackButton from '@/components/ui/navigation/BackButton';

export default function NotFound() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            <div className="relative mb-8 pt-10">
                <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto size-40 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="squircle-lg relative inline-block border border-(--border-color)/20 bg-(--bg-card) p-6 text-purple-500 shadow-2xl">
                    <Search className="size-16" />
                </div>
                <div className="absolute top-1/2 left-1/2 -z-10 -translate-1/2 select-none">
                    <span className="text-9xl font-black tracking-tighter text-purple-500/5">404</span>
                </div>
            </div>

            <h2 className="mb-3 text-4xl font-black tracking-tight text-(--text-main)">
                Pagina niet gevonden
            </h2>
            
            <p className="mx-auto mb-10 max-w-md font-medium text-(--text-muted)">
                Oeps! De pagina die je zoekt lijkt te zijn verhuisd of bestaat niet meer. Geen probleem, we helpen je graag terug.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <BackButton 
                    href="/" 
                    text="Terug naar Home" 
                    icon={Home} 
                    className="squircle px-8 py-3.5"
                />

                <BackButton 
                    onClick={() => window.history.back()} 
                    text="Vorige Pagina" 
                    icon={ArrowLeft} 
                    className="squircle px-8 py-3.5"
                />
            </div>
        </div>
    );
}
