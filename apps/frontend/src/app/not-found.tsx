'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            {/* Header with Icon Box matching GlobalError */}
            <div className="relative mb-8 pt-10">
                {/* Decorative background glow */}
                <div className="absolute inset-x-0 top-0 h-40 w-40 mx-auto blur-3xl bg-[var(--color-purple-500)]/10 rounded-full" />
                
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
                <Link
                    href="/"
                    className="flex items-center gap-2 rounded-full bg-[var(--color-purple-500)] text-white px-8 py-3.5 font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all text-sm uppercase tracking-widest"
                >
                    <Home className="h-4 w-4" />
                    Terug naar Home
                </Link>

                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 rounded-full px-8 py-3.5 font-bold text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-color)]/20 hover:bg-[var(--border-color)]/5 transition-all text-sm uppercase tracking-widest"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Vorige Pagina
                </button>
            </div>
        </div>
    );
}
