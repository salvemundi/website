'use client';

import React from 'react';
import Image from 'next/image';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import type { IntroBlog } from '@salvemundi/validations/schema/intro.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { INTRO_BLOG_TYPES } from '@/shared/lib/constants/intro.constants';
import { formatDate } from '@/shared/lib/utils/date';

interface Props {
    blogs: IntroBlog[];
}

export function IntroBlogGrid({ blogs }: Props) {
    if (blogs.length === 0) return (
        <div className="py-20 text-center">
            <p className="text-text-muted italic font-medium uppercase tracking-widest text-xs">
                Er zijn nog geen berichten geplaatst.
            </p>
        </div>
    );

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(350px,100%),1fr))] gap-8">
            {blogs.map((blog, idx) => {
                const config = INTRO_BLOG_TYPES[blog.blog_type];
                const date = blog.created_at;

                return (
                    <div key={blog.id} className="@container">
                        <Link 
                            href={`/intro/blogs/${blog.slug || blog.id}`}
                            className="group relative flex flex-col h-full bg-white dark:bg-white/5 squircle-lg border border-border-color/40 hover:border-theme-purple/50 transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            {blog.image && (
                                <div className="relative w-full h-40 sm:h-48 shrink-0 bg-bg-main">
                                    <Image
                                        src={getImageUrl(blog.image as string, { width: 700, height: 300, fit: 'cover' })}
                                        alt={blog.title}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <div className="p-8 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${config.badgeClass}`}>
                                        {config.label}
                                    </span>
                                    {date && (
                                        <div className="flex items-center gap-1.5 text-text-muted opacity-60">
                                            <Calendar className="h-3 w-3" />
                                            <span className="text-[9px] font-bold uppercase tracking-tighter">
                                                {formatDate(date, 'd MMM')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold tracking-tight text-theme-purple mb-4 line-clamp-2 group-hover:text-theme-purple/80 transition-colors">
                                    {blog.title}
                                </h3>

                                <p className="text-sm text-text-muted line-clamp-3 mb-8 font-medium leading-relaxed">
                                    {blog.excerpt || 'Klik om meer te lezen over deze update van de introductie.'}
                                </p>

                                <div className="mt-auto pt-6 border-t border-border-color/10 flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-theme-purple">Lees meer</span>
                                    <div className="h-8 w-8 rounded-full bg-theme-purple/5 flex items-center justify-center group-hover:bg-theme-purple transition-colors">
                                        <ArrowRight className="h-4 w-4 text-theme-purple group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                );
            })}
        </div>
    );
}
