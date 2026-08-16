import React from 'react';
import Image from 'next/image';
import { getIntroBlogBySlug } from '@/server/actions/public/intro.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { notFound } from 'next/navigation';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils/image-utils';
import { INTRO_BLOG_TYPES } from '@/shared/lib/constants/intro.constants';
import { formatDate } from '@/shared/lib/utils/date';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const blog = await getIntroBlogBySlug(slug);
    if (!blog) return { title: 'Blog niet gevonden' };

    return {
        title: `${blog.title} | Salve Mundi Introductie`,
        description: blog.excerpt || 'Lees meer over de introductie van Salve Mundi.'
    };
}

export default async function BlogDetailPage({ params }: Props) {
    const { slug } = await params;
    const blog = await getIntroBlogBySlug(slug);

    if (!blog) {
        notFound();
    }

    const config = INTRO_BLOG_TYPES[blog.blog_type];
    const date = blog.created_at;

    return (
        <PublicPageShell>
            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-24">
                <Link 
                    href="/intro/blogs" 
                    className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-purple-600 dark:hover:text-purple-400 transition-colors group mb-12"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Terug naar overzicht
                </Link>

                <header className="mb-12">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                         <span className={`text-[10px] font-bold px-4 py-1.5 rounded-full ${config.badgeClass}`}>
                            {config.label}
                        </span>
                        {date && (
                            <div className="flex items-center gap-2 text-text-muted">
                                <Calendar className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                                <span className="text-[10px] font-semibold text-text-muted">
                                    {formatDate(date, 'd MMMM yyyy')}
                                </span>
                            </div>
                        )}
                    </div>

                    <h1 className="text-4xl lg:text-7xl font-black tracking-tight text-text-main leading-[1.1] mb-8">
                        {blog.title}
                    </h1>

                    {blog.excerpt && (
                        <p className="text-xl lg:text-2xl text-text-muted font-medium leading-relaxed italic border-l-4 border-purple-500/40 pl-6">
                            {blog.excerpt}
                        </p>
                    )}
                </header>

                {blog.image && (
                    <div className="relative w-full aspect-video mb-12 squircle-lg overflow-hidden border border-border-color dark:border-white/10 shadow-lg">
                        <Image
                            src={getImageUrl(blog.image as string, { width: 1600, fit: 'inside' })}
                            alt={blog.title}
                            fill
                            unoptimized
                            className="object-cover"
                        />
                    </div>
                )}

                <div className="prose dark:prose-invert max-w-none">
                    <div className="text-lg lg:text-xl text-text-main leading-relaxed whitespace-pre-wrap font-medium">
                        {blog.content}
                    </div>
                </div>

                <footer className="mt-20 pt-10 border-t border-border-color/20">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8 bg-bg-card border border-border-color dark:border-white/10 p-8 lg:p-12 squircle-lg shadow-lg">
                        <div className="space-y-2 text-center sm:text-left">
                            <h4 className="text-xl font-black text-theme-purple">Wil je niets missen?</h4>
                            <p className="text-sm text-text-muted">Houd deze pagina en onze socials in de gaten voor meer updates.</p>
                        </div>
                        <Link 
                            href="/intro" 
                            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white squircle font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-600/20"
                        >
                            Naar de Introductie
                        </Link>
                    </div>
                </footer>
            </article>
        </PublicPageShell>
    );
}

