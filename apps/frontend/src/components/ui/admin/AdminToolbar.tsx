'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface AdminToolbarProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    actions?: React.ReactNode;
}

/**
 * A standardized header/toolbar for all admin pages.
 * Replaces the old "Hero Banners" with a compact horizontal layout.
 */
export default function AdminToolbar({
    title,
    subtitle,
    backHref,
    actions
}: AdminToolbarProps) {
    return (
        <header className="bg-[var(--beheer-card-bg)] border-b border-[var(--beheer-border)] sticky top-0 z-40 w-full">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        {backHref && (
                            <Link 
                                href={backHref} 
                                title="Terug"
                                className="p-3 rounded-[var(--beheer-radius)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] transition-all active:scale-95"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Link>
                        )}
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-[var(--beheer-text)] tracking-tighter uppercase leading-tight">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-[10px] font-bold text-[var(--beheer-text-muted)] uppercase tracking-widest leading-none mt-1">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {actions && (
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
