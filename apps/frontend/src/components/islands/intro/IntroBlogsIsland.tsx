'use client';

import React from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { IntroBlogGrid, type Blog } from './IntroBlogGrid';

interface Props {
    blogs: Blog[];
}

export function IntroBlogsIsland({ blogs }: Props) {
    if (blogs.length === 0) return null;

    return (
        <section className="mt-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[var(--beheer-accent)]">
                        <Newspaper className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Nieuws & Updates</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight text-theme dark:text-white">
                        Laatste Nieuws
                    </h2>
                </div>
                <Link 
                    href="/intro/blogs" 
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] transition-colors group"
                >
                    Alle berichten bekijken
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>

            <IntroBlogGrid blogs={blogs} />
        </section>
    );
}
