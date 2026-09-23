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
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 pt-20 text-center select-none">
            {/* Header with Icon Box matching GlobalError */}
            <div className="relative mb-8">
                {/* Decorative background glow */}
                <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto size-40 rounded-full bg-purple-500/10 blur-3xl" />

                {/* Icon Container */}
                <div className="relative inline-block rounded-3xl border border-border-color/20 bg-bg-card p-6 text-purple-500 shadow-2xl">
                    <ShieldAlert className="size-16" />
                </div>

                {/* Faded 403 text behind the icon */}
                <div className="absolute top-1/2 left-1/2 -z-10 -translate-1/2 select-none">
                    <span className="text-9xl font-bold tracking-normal text-purple-500/5">403</span>
                </div>
            </div>

            <h2 className="mb-3 text-4xl font-bold tracking-tight text-theme-purple">
                {title}
            </h2>

            <p className="mx-auto mb-10 max-w-md font-sans leading-relaxed font-medium text-text-muted">
                {description}
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                    href="/"
                    className="flex items-center gap-2 rounded-full bg-purple-500 px-8 py-3.5 text-base font-bold tracking-widest text-white shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5 hover:shadow-purple-500/40"
                >
                    <Home className="size-4" />
                    Terug naar Home
                </Link>

                {backHref ? (
                    <Link
                        href={backHref}
                        className="flex items-center gap-2 rounded-full border border-border-color/20 bg-bg-card px-8 py-3.5 text-base font-bold tracking-widest text-text-main transition-all hover:bg-black/5 dark:hover:bg-white/5"
                    >
                        <ArrowLeft className="size-4" />
                        Vorige Pagina
                    </Link>
                ) : (
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 rounded-full border border-border-color/20 bg-bg-card px-8 py-3.5 text-base font-bold tracking-widest text-text-main transition-all hover:bg-black/5 dark:hover:bg-white/5"
                    >
                        <ArrowLeft className="size-4" />
                        Vorige Pagina
                    </button>
                )}
            </div>
        </div>
    );
}
