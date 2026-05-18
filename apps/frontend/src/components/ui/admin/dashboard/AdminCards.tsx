import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface CardProps {
    title?: string;
    href?: string;
    disabled?: boolean;
    isExternal?: boolean;
    colorClass?: 'purple' | 'blue' | 'red' | 'green' | 'orange' | 'teal' | 'amber';
}

const getColorClasses = (colorClass: string = 'purple') => {
    const colors = new Map<string, string>([
        ['purple', 'text-[var(--beheer-accent)] bg-[var(--beheer-accent)]/10 border-[var(--beheer-accent)]/20'],
        ['blue', 'text-blue-500 bg-blue-500/10 border-blue-500/20'],
        ['red', 'text-red-500 bg-red-500/10 border-red-500/20'],
        ['green', 'text-green-500 bg-green-500/10 border-green-500/20'],
        ['orange', 'text-orange-500 bg-orange-500/10 border-orange-500/20'],
        ['teal', 'text-teal-500 bg-teal-500/10 border-teal-500/20'],
        ['amber', 'text-amber-500 bg-amber-500/10 border-amber-500/20']
    ]);
    return colors.get(colorClass) || colors.get('purple') || '';
};

export function ActionCard({
    title = '',
    subtitle,
    value,
    icon,
    href,
    pulse: _pulse = false,
    colorClass = 'purple',
    disabled = false,
    isExternal = false
}: CardProps & {
    subtitle?: string;
    value?: string | number;
    icon?: React.ReactNode;
    pulse?: boolean;
}) {
    const isLink = !disabled && href;
    const isInternal = isLink && !isExternal;
    const Component = (isInternal ? Link : (isLink ? 'a' : 'div')) as React.ElementType;
    const colorStyle = getColorClasses(colorClass);

    return (
        <Component
            {...((isLink && href) ? {
                href,
                ...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})
            } : {})}
            className={`w-full flex items-center gap-4 p-4 rounded-[var(--beheer-radius)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] shadow-sm relative overflow-hidden
                ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : ''} 
                ${!disabled && href ? 'hover:border-[var(--beheer-accent)]/40 hover:bg-[var(--beheer-accent)]/[0.02] hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group' : ''}`}
        >
            {icon && (
                <div className={`p-3 rounded-xl transition-colors ${colorStyle} group-hover:bg-opacity-20 shrink-0`}>
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-6 w-6' }) : icon}
                </div>
            )}

            <div className="text-left flex-1 min-w-0 pr-2">
                <p className="text-base font-semibold tracking-normal text-[var(--beheer-text)] group-hover:text-[var(--beheer-accent)] transition-colors leading-tight mb-1 truncate">
                    {title}
                </p>
                {subtitle && (
                    <p className="font-medium text-base text-[var(--beheer-text-muted)] truncate leading-tight opacity-60">
                        {subtitle}
                    </p>
                )}
            </div>

            {value !== undefined && (
                <div className="shrink-0 flex flex-col items-end">
                    <span className="text-2xl font-semibold tracking-normal text-[var(--beheer-text)] opacity-80 group-hover:opacity-100 group-hover:text-[var(--beheer-accent)] transition-all">
                        {value}
                    </span>
                </div>
            )}

            {isLink && (
                <div className="text-[var(--beheer-accent)] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all pr-1">
                    <ChevronRight className="h-5 w-5" />
                </div>
            )}
        </Component>
    );
}