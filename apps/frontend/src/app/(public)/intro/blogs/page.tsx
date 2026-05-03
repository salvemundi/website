import React from 'react';
import { getAllIntroBlogsPublic } from '@/server/actions/intro.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { IntroBlogGrid } from '@/components/islands/intro/IntroBlogGrid';
import { Newspaper, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Nieuws & Updates | Salve Mundi Introductie',
    description: 'Blijf op de hoogte van het laatste nieuws rondom de Salve Mundi introductieweek.',
};

import { connection } from 'next/server';
import { Suspense } from 'react';

export default async function BlogsPage() {
    return (
        <PublicPageShell>
            <Suspense fallback={<BlogsSkeleton />}>
                <BlogsContent />
            </Suspense>
        </PublicPageShell>
    );
}

function BlogsSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20 animate-pulse">
            <div className="h-48 bg-[var(--bg-card)] rounded-3xl mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-80 bg-[var(--bg-card)] rounded-3xl" />
                ))}
            </div>
        </div>
    );
}

async function BlogsContent() {
    await connection();
    const blogs = await getAllIntroBlogsPublic();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20">
            <div className="mb-12">
                <Link 
                    href="/intro" 
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] transition-colors group mb-8"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Terug naar Introductie
                </Link>

                <div className="flex items-center gap-2 text-[var(--beheer-accent)] mb-4">
                    <div className="p-2 bg-[var(--beheer-accent)]/10 rounded-lg">
                        <Newspaper className="h-6 w-6" />
                    </div>
                    <span className="text-[12px] font-black uppercase tracking-[0.4em]">Archief</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tight text-theme dark:text-white">
                    Alle Berichten
                </h1>
            </div>

            <IntroBlogGrid blogs={blogs} />
        </div>
    );
}
