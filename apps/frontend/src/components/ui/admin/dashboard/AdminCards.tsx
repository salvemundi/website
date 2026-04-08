import React from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';

interface CardProps {
    isLoading?: boolean;
    title?: string;
    href?: string;
    disabled?: boolean;
    colorClass?: 'purple' | 'blue' | 'red' | 'green' | 'orange' | 'teal' | 'amber';
}

const getColorClasses = (colorClass: string = 'purple') => {
    const colors: Record<string, string> = {
        purple: 'text-[var(--beheer-accent)] bg-[var(--beheer-accent)]/10 border-[var(--beheer-accent)]/20',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        red: 'text-red-500 bg-red-500/10 border-red-500/20',
        green: 'text-green-500 bg-green-500/10 border-green-500/20',
        orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        teal: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    };
    return colors[colorClass] || colors.purple;
};

/**
 * StatCard: Deprecated in favor of the horizontal ActionCard style, 
 * but kept for backward compatibility if needed.
 */
export function StatCard({
    isLoading = false,
    title = '',
    value,
    subtitle,
    icon,
    href,
    colorClass = 'purple',
    disabled = false
}: CardProps & {
    value?: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
}) {
    const isLink = !disabled && href && !isLoading;
    const Component = (isLink ? Link : 'div') as any;
    const colorStyle = getColorClasses(colorClass);

    return (
        <Component
            {...((isLink && href) ? { href } : {})}
            className={`block w-full bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] p-5 relative overflow-hidden transition-all ${
                !disabled && href && !isLoading
                    ? 'hover:shadow-lg hover:border-[var(--beheer-accent)]/30 hover:-translate-y-1 group cursor-pointer' 
                    : ''
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-busy={isLoading}
        >
            <div className="relative z-10 flex flex-col gap-4">
                <div className={`p-2.5 w-fit rounded-xl ${isLoading ? 'bg-slate-200 dark:bg-slate-800' : colorStyle} transition-colors group-hover:bg-opacity-20`}>
                    {isLoading ? (
                        <div className="h-5 w-5" /> 
                    ) : (
                        React.isValidElement(icon) ? React.cloneElement(icon as any, { className: 'h-5 w-5' }) : icon
                    )}
                </div>
                
                <div className="space-y-0.5 mt-1">
                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-3 w-24 opacity-50" />
                        </div>
                    ) : (
                        <>
                            <p className="text-lg font-black text-[var(--beheer-text)] tracking-tight leading-tight group-hover:text-[var(--beheer-accent)] transition-colors">{title}</p>
                            <div className="text-2xl font-black text-[var(--beheer-text-muted)] tracking-tighter leading-none">
                                {value}
                            </div>
                            {subtitle && (
                                <p className="text-[10px] font-bold text-[var(--beheer-text-muted)] tracking-widest opacity-60 leading-tight pt-1">
                                    {subtitle}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Component>
    );
}

/**
 * Universal Dashboard Button (ActionCard style).
 * Horizontal layout: [Icon] [Name/Label] [Value]
 */
export function ActionCard({
    isLoading = false,
    title = '',
    subtitle,
    value,
    icon,
    href,
    colorClass = 'purple',
    disabled = false
}: CardProps & {
    subtitle?: string;
    value?: string | number;
    icon?: React.ReactNode;
}) {
    const isLink = !disabled && href && !isLoading;
    const Component = (isLink ? Link : 'div') as any;
    const colorStyle = getColorClasses(colorClass);
    
    return (
        <Component
            {...((isLink && href) ? { href } : {})}
            className={`w-full flex items-center gap-4 p-4 rounded-[var(--beheer-radius)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : ''} ${!disabled && !isLoading && href ? 'hover:border-[var(--beheer-accent)]/30 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group' : ''} ${isLoading ? 'animate-pulse cursor-default pointer-events-none' : ''}`}
            aria-busy={isLoading}
        >
            {/* Left: Icon / Skeleton */}
            <div className={`p-3 rounded-xl transition-colors ${isLoading ? 'bg-slate-200 dark:bg-slate-800' : colorStyle} group-hover:bg-opacity-20 shrink-0`}>
                {isLoading ? (
                    <div className="h-6 w-6" />
                ) : (
                    React.isValidElement(icon) ? React.cloneElement(icon as any, { className: 'h-6 w-6' }) : icon
                )}
            </div>

            {/* Middle: Text hierarchy */}
            <div className="text-left flex-1 min-w-0 pr-2">
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-16 opacity-50" />
                    </div>
                ) : (
                    <>
                        <p className="text-sm font-black tracking-tight text-[var(--beheer-text)] group-hover:text-[var(--beheer-accent)] transition-colors leading-tight mb-1.5 truncate">
                            {title}
                        </p>
                        {subtitle && (
                            <p className="font-bold text-[10px] text-[var(--beheer-text-muted)] tracking-widest truncate leading-tight opacity-60">
                                {subtitle}
                            </p>
                        )}
                    </>
                )}
            </div>

            {/* Right: Optional value/stat */}
            {!isLoading && value !== undefined && value !== null && (
                <div className="shrink-0 flex flex-col items-end">
                    <span className="text-2xl font-black italic tracking-tighter text-[var(--beheer-text)] opacity-80 group-hover:opacity-100 group-hover:text-[var(--beheer-accent)] transition-all">
                        {value}
                    </span>
                </div>
            )}
            
            {isLoading && (
                <div className="shrink-0">
                    <Skeleton className="h-6 w-8 opacity-40" />
                </div>
            )}

            {/* Indicator arrow if link and NO value (including 0) */}
            {!isLoading && isLink && (value === undefined || value === null) && (
                <div className="text-[var(--beheer-accent)] opacity-20 group-hover:opacity-100 transition-opacity pr-2">
                    <span className="text-xs font-black italic">→</span>
                </div>
            )}
        </Component>
    );
}

export function ListCard({
    isLoading = false,
    title = '',
    icon,
    children
}: {
    isLoading?: boolean;
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className={`bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] shadow-sm p-6 overflow-hidden h-full flex flex-col ${isLoading ? 'animate-pulse' : ''}`} aria-busy={isLoading}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`${isLoading ? 'bg-slate-200 dark:bg-slate-800' : 'bg-[var(--beheer-accent)]/10'} p-2.5 rounded-xl text-[var(--beheer-accent)] transition-colors`}>
                        {isLoading ? (
                            <div className="h-5 w-5" />
                        ) : (
                            React.isValidElement(icon) ? React.cloneElement(icon as any, { className: 'h-5 w-5' }) : icon
                        )}
                    </div>
                    {isLoading ? (
                        <Skeleton className="h-6 w-48" />
                    ) : (
                        <h3 className="text-sm font-black text-[var(--beheer-text)] tracking-widest leading-tight">{title}</h3>
                    )}
                </div>
            </div>
            <div className="space-y-1 flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
}
