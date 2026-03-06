'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            {/* Grote "404" met gradient effect */}
            <h1 className="text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[var(--color-purple-500)] to-[var(--color-purple-900)] opacity-20 select-none">
                404
            </h1>

            <div className="mt-[-4rem] z-10">
                <h2 className="text-3xl font-bold text-[var(--text-main)] mb-2">
                    Oeps! Deze pagina is (tijdelijk) niet beschikbaar.
                </h2>
                <p className="text-[var(--text-muted)] max-w-md mx-auto mb-8">
                    Het lijkt erop dat deze route is uitgeschakeld of nooit heeft bestaan.
                    Maak je geen zorgen, we wijzen je graag de weg terug naar de bewoonde wereld.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/"
                        className="flex items-center gap-2 rounded-full bg-[var(--color-purple-500)] text-white px-6 py-3 font-semibold shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1 transition-all"
                    >
                        <Home className="h-4 w-4" />
                        Terug naar Home
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-[var(--color-purple-500)] border border-[var(--color-purple-500)]/20 hover:bg-[var(--color-purple-500)]/5 transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Vorige pagina
                    </button>
                </div>
            </div>

            {/* Decoratieve elementen */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--color-purple-500)]/5 blur-3xl rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-purple-200)]/5 blur-3xl rounded-full" />
            </div>
        </div>
    );
}
