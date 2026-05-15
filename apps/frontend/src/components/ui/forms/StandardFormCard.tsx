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
        <section className={`relative bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] shadow-2xl p-6 sm:p-8 md:p-10 overflow-hidden group ${className}`}>
            {/* Subtle decorative background element */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--color-purple-500)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-purple-500)]/10 transition-colors duration-700" />

            <div className="relative z-10">
                <header className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 sm:mb-10">
                    <div className="space-y-1">
                        {subtitle && (
                            <p className="text-[10px] font-black text-[var(--text-muted)] tracking-[0.4em] uppercase opacity-60 mb-2">
                                {subtitle}
                            </p>
                        )}
                        <h2 className="form-title flex items-center gap-3">
                            {icon && <span className="text-[var(--color-purple-500)]">{icon}</span>}
                            {title}
                        </h2>
                        {description && (
                            <p className="text-sm font-medium text-[var(--text-muted)] leading-relaxed max-w-lg">
                                {description}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-3 self-stretch sm:self-auto">
                        {headerActions && (
                            <div className="flex items-center gap-2">
                                {headerActions}
                            </div>
                        )}
                        
                        {price !== undefined && (
                            <div className="text-right">
                                <span className="block text-[10px] font-black text-[var(--text-muted)] tracking-[0.2em] uppercase mb-1">Prijs</span>
                                <span className="text-3xl font-black text-[var(--color-purple-700)] dark:text-[var(--color-purple-300)]">
                                    €{price.toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                        )}
                    </div>
                </header>

                <div className="w-full">
                    {children}
                </div>
            </div>
        </section>
    );
}
