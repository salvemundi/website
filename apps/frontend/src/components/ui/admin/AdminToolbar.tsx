import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface AdminToolbarProps {
    title?: string;
    subtitle?: string;
    backHref?: string;
    actions?: React.ReactNode;
    centered?: boolean;
}

/**
 * A standardized header/toolbar for all admin pages.
 * Replaces the old "Hero Banners" with a compact horizontal layout.
 */
export default function AdminToolbar({
    title,
    subtitle,
    backHref,
    actions,
    centered = false
}: AdminToolbarProps) {
    return (
        <header 
            className="bg-[var(--beheer-card-bg)] border-b border-[var(--beheer-border)] sticky top-[var(--header-total-height)] z-30 w-full transition-all"
        >
            <div className="admin-container py-4">
                <div className={`flex flex-col ${centered ? 'items-center text-center mx-auto' : 'md:flex-row justify-between items-start md:items-center'} gap-4`}>
                    <div className={`flex items-center gap-4 ${centered ? 'flex-col' : ''}`}>
                        {backHref && (
                            <Link 
                                href={backHref} 
                                title="Terug"
                                className="p-2 rounded-xl bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] transition-all active:scale-95 shadow-sm"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        )}
                        <div className={`flex flex-col ${centered ? 'items-center' : ''}`}>
                            <h1 className="text-xl md:text-2xl font-semibold text-[var(--beheer-text)] tracking-tight leading-tight">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-sm text-[var(--beheer-text-muted)] font-medium leading-tight mt-0.5">
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
