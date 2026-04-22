'use client';

import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface Blog {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    blog_type: string;
    created_at?: string;
}

interface Props {
    blogs: Blog[];
}

const typeConfig: Record<string, { label: string; color: string }> = {
    update: { label: 'Update', color: 'blue' },
    pictures: { label: 'Foto\'s', color: 'pink' },
    event: { label: 'Evenement', color: 'amber' },
    announcement: { label: 'Aankondiging', color: 'emerald' }
};

export function IntroBlogGrid({ blogs }: Props) {
    if (blogs.length === 0) return (
        <div className="py-20 text-center">
            <p className="text-[var(--beheer-text-muted)] italic font-medium uppercase tracking-widest text-xs">
                Er zijn nog geen berichten geplaatst.
            </p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, idx) => {
                const config = typeConfig[blog.blog_type] || typeConfig.update;
                const date = blog.created_at;

                return (
                    <Link 
                        key={blog.id} 
                        href={`/intro/blogs/${blog.slug || blog.id}`}
                        className="group relative flex flex-col bg-white dark:bg-white/5 rounded-3xl border border-[var(--beheer-border)]/40 hover:border-[var(--beheer-accent)]/50 transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <div className="p-8 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-${config.color}-500/10 text-${config.color}-500 border border-${config.color}-500/20`}>
                                    {config.label}
                                </span>
                                {date && (
                                    <div className="flex items-center gap-1.5 text-[var(--beheer-text-muted)] opacity-60">
                                        <Calendar className="h-3 w-3" />
                                        <span className="text-[9px] font-bold uppercase tracking-tighter">
                                            {new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-black uppercase tracking-tight text-theme dark:text-white mb-4 line-clamp-2 group-hover:text-[var(--beheer-accent)] transition-colors">
                                {blog.title}
                            </h3>

                            <p className="text-sm text-[var(--beheer-text-muted)] line-clamp-3 mb-8 font-medium leading-relaxed">
                                {blog.excerpt || 'Klik om meer te lezen over deze update van de introductie.'}
                            </p>

                            <div className="mt-auto pt-6 border-t border-[var(--beheer-border)]/10 flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--beheer-accent)]">Lees meer</span>
                                <div className="h-8 w-8 rounded-full bg-[var(--beheer-accent)]/5 flex items-center justify-center group-hover:bg-[var(--beheer-accent)] transition-colors">
                                    <ArrowRight className="h-4 w-4 text-[var(--beheer-accent)] group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
