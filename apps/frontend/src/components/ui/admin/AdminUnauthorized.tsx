'use client';

import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

interface AdminUnauthorizedProps {
    title?: string;
    description?: string;
    backHref?: string;
}

export default function AdminUnauthorized({
    title = 'Geen toegang',
    description = 'Je hebt geen rechten om deze sectie te bekijken. Neem contact op met de ICT-commissie als je denkt dat dit een fout is.',
    backHref,
}: AdminUnauthorizedProps) {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center select-none pt-20">
            {/* Header with Icon Box matching GlobalError */}
            <div className="relative mb-8">
                {/* Decorative background glow */}
                <div className="absolute inset-x-0 top-0 h-40 w-40 mx-auto blur-3xl bg-purple-500/10 rounded-full pointer-events-none" />

                {/* Icon Container */}
                <div className="relative rounded-3xl bg-bg-card p-6 shadow-2xl border border-border-color/20 text-purple-500 inline-block">
                    <ShieldAlert className="h-16 w-16" />
                </div>

                {/* Faded 403 text behind the icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 select-none">
                    <span className="text-9xl font-bold tracking-normal text-purple-500/5">403</span>
                </div>
            </div>

            <h2 className="text-4xl font-bold text-theme-purple mb-3 tracking-tight">
                {title}
            </h2>

            <p className="text-text-muted max-w-md mx-auto mb-10 font-medium leading-relaxed font-sans">
                {description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Link
                    href="/"
                    className="flex items-center gap-2 rounded-full bg-purple-500 text-white px-8 py-3.5 font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all text-base tracking-widest"
                >
                    <Home className="h-4 w-4" />
                    Terug naar Home
                </Link>

                {backHref ? (
                    <Link
                        href={backHref}
                        className="flex items-center gap-2 rounded-full px-8 py-3.5 font-bold text-text-main bg-bg-card border border-border-color/20 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-base tracking-widest"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Vorige Pagina
                    </Link>
                ) : (
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 rounded-full px-8 py-3.5 font-bold text-text-main bg-bg-card border border-border-color/20 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-base tracking-widest"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Vorige Pagina
                    </button>
                )}
            </div>
        </div>
    );
}
