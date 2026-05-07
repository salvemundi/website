import React from 'react';
import { getIntroBlogBySlug } from '@/server/actions/intro.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { notFound } from 'next/navigation';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const blog = await getIntroBlogBySlug(slug);
    if (!blog) return { title: 'Blog niet gevonden' };

    return {
        title: `${blog.title} | Salve Mundi Introductie`,
        description: blog.excerpt || 'Lees meer over de introductie van Salve Mundi.',
    };
}

const typeConfig: Record<string, { label: string; color: string }> = {
    update: { label: 'Update', color: 'blue' },
    pictures: { label: 'Foto\'s', color: 'pink' },
    event: { label: 'Evenement', color: 'amber' },
    announcement: { label: 'Aankondiging', color: 'emerald' }
};

export default async function BlogDetailPage({ params }: Props) {
    const { slug } = await params;
    const blog = await getIntroBlogBySlug(slug);

    if (!blog) {
        notFound();
    }

    const config = typeConfig[blog.blog_type] || typeConfig.update;
    const date = blog.created_at;

    return (
        <PublicPageShell>
            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <Link 
                    href="/intro/blogs" 
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] transition-colors group mb-12"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Terug naar overzicht
                </Link>

                <header className="mb-12">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                         <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-${config.color}-500/10 text-${config.color}-500 border border-${config.color}-500/20`}>
                            {config.label}
                        </span>
                        {date && (
                            <div className="flex items-center gap-2 text-[var(--beheer-text-muted)]">
                                <Calendar className="h-4 w-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        )}
                    </div>

                    <h1 className="text-4xl lg:text-7xl font-black uppercase tracking-tight text-theme dark:text-white leading-[1.1] mb-8">
                        {blog.title}
                    </h1>

                    {blog.excerpt && (
                        <p className="text-xl lg:text-2xl text-[var(--beheer-text-muted)] font-medium leading-relaxed italic border-l-4 border-[var(--beheer-accent)]/30 pl-6">
                            {blog.excerpt}
                        </p>
                    )}
                </header>

                <div className="prose prose-invert max-w-none">
                    <div className="text-lg lg:text-xl text-theme dark:text-white/90 leading-relaxed whitespace-pre-wrap font-medium">
                        {blog.content}
                    </div>
                </div>

                <footer className="mt-20 pt-10 border-t border-[var(--beheer-border)]/10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8 bg-[var(--beheer-accent)]/5 p-8 lg:p-12 squircle-lg border border-[var(--beheer-accent)]/10">
                        <div className="space-y-2 text-center sm:text-left">
                            <h4 className="text-xl font-black uppercase tracking-tight text-theme dark:text-white">Wil je niets missen?</h4>
                            <p className="text-sm text-[var(--beheer-text-muted)]">Houd deze pagina en onze socials in de gaten voor meer updates.</p>
                        </div>
                        <Link 
                            href="/intro" 
                            className="px-8 py-4 bg-[var(--beheer-accent)] text-white squircle font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[var(--beheer-accent)]/20"
                        >
                            Naar de Introductie
                        </Link>
                    </div>
                </footer>
            </article>
        </PublicPageShell>
    );
}
