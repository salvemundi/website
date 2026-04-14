import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AdminToolbarProps {
    isLoading?: boolean;
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
    isLoading = false,
    title,
    subtitle,
    backHref,
    actions
}: AdminToolbarProps) {
    return (
        <header 
            aria-busy={isLoading}
            className="bg-[var(--beheer-card-bg)] border-b border-[var(--beheer-border)] sticky top-[var(--header-total-height,80px)] z-30 w-full transition-all"
        >
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
                        <div className="flex flex-col">
                            <h1 className={cn(
                                "text-2xl md:text-3xl font-black text-[var(--beheer-text)] tracking-tighter leading-tight",
                                isLoading && "ghost-item"
                            )}>
                                {isLoading ? "Loading Page Title..." : title}
                            </h1>
                            {subtitle && (
                                <p className={cn(
                                    "text-xs font-bold text-[var(--beheer-text-muted)] tracking-wide mt-1 opacity-60",
                                    isLoading && "ghost-item"
                                )}>
                                    {isLoading ? "Loading subtitle information..." : subtitle}
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
