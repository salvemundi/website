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
        <section className={`@container relative bg-bg-card dark:border dark:border-white/10 rounded-[2rem] shadow-2xl p-6 sm:p-8 md:p-10 overflow-hidden group ${className}`}>
            {/* Subtle decorative background element */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors duration-700" />

            <div className="relative z-10 flex flex-col h-full flex-1">
                <header className="flex flex-col @md:flex-row justify-between items-start gap-4 mb-8 @md:mb-10 shrink-0">
                    <div className="space-y-1">
                        {subtitle && (
                            <p className="text-[11px] font-bold text-text-muted opacity-75 mb-2">
                                {subtitle}
                            </p>
                        )}
                        <h2 className="form-title flex items-start gap-3 break-words">
                            {icon && <span className="shrink-0 mt-1 text-purple-500">{icon}</span>}
                            <span className="flex-1">{title}</span>
                        </h2>
                        {description && (
                            <p className="text-sm font-medium text-text-muted leading-relaxed max-w-lg">
                                {description}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-3 self-stretch @md:self-auto shrink-0">
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

                <div className="w-full flex-1 flex flex-col">
                    {children}
                </div>
            </div>
        </section>
    );
}
