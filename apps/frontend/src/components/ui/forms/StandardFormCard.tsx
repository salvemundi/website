import React from 'react';

interface StandardFormCardProps {
    title: string;
    subtitle?: string;
    description?: string;
    icon?: React.ReactNode;
    price?: number;
    headerActions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

/**
 * StandardFormCard: A consistent wrapper for all public registration and contact forms.
 * Standardizes typography, spacing, and container styling.
 */
export function StandardFormCard({
    title,
    subtitle,
    description,
    icon,
    price,
    headerActions,
    children,
    className = ""
}: StandardFormCardProps) {
    return (
        <section className={`group @container relative overflow-hidden rounded-4xl bg-bg-card p-6 shadow-2xl sm:p-8 md:p-10 dark:border dark:border-white/10 ${className}`}>
            {/* Subtle decorative background element */}
            <div className="absolute -top-24 -right-24 size-48 rounded-full bg-purple-500/5 blur-3xl transition-colors duration-700 group-hover:bg-purple-500/10" />

            <div className="relative z-10 flex h-full flex-1 flex-col">
                <header className="mb-8 flex shrink-0 flex-col items-start justify-between gap-4 @md:mb-10 @md:flex-row">
                    <div className="space-y-1">
                        {subtitle && (
                            <p className="mb-2 text-[11px] font-bold text-text-muted opacity-75">
                                {subtitle}
                            </p>
                        )}
                        <h2 className="form-title flex items-start gap-3 wrap-break-word">
                            {icon && <span className="mt-1 shrink-0 text-purple-500">{icon}</span>}
                            <span className="flex-1">{title}</span>
                        </h2>
                        {description && (
                            <p className="max-w-lg text-sm leading-relaxed font-medium text-text-muted">
                                {description}
                            </p>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-3 self-stretch @md:self-auto">
                        {headerActions && (
                            <div className="flex items-center gap-2">
                                {headerActions}
                            </div>
                        )}

                        {price !== undefined && (
                            <div className="text-right">
                                <span className="text-3xl font-black text-purple-700 dark:text-purple-300">
                                    €{price.toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                        )}
                    </div>
                </header>

                <div className="flex w-full flex-1 flex-col">
                    {children}
                </div>
            </div>
        </section>
    );
}
