import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AdminToolbarProps {
    title?: string;
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
        <header 
            className="bg-[var(--beheer-card-bg)] border-b border-[var(--beheer-border)] sticky top-[var(--header-total-height,80px)] z-30 w-full transition-all"
        >
            <div className="container mx-auto px-4 py-4 max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        {backHref && (
                            <Link 
                                href={backHref} 
                                title="Terug"
                                className="p-2 rounded-xl bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] transition-all active:scale-95 shadow-sm"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        )}
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-2xl font-black text-[var(--beheer-text)] tracking-tighter leading-tight uppercase">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-[10px] font-bold text-[var(--beheer-text-muted)] tracking-widest uppercase mt-0.5 opacity-50">
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
