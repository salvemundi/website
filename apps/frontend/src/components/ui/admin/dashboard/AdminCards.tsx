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
        ['purple', 'text-theme-purple bg-theme-purple/10 border-theme-purple/20'],
        ['blue', 'text-blue-500 bg-blue-500/10 border-blue-500/20'],
        ['red', 'text-red-500 bg-red-500/10 border-red-500/20'],
        ['green', 'text-green-500 bg-green-500/10 border-green-500/20'],
        ['orange', 'text-orange-500 bg-orange-500/10 border-orange-500/20'],
        ['teal', 'text-teal-500 bg-teal-500/10 border-teal-500/20'],
        ['amber', 'text-amber-500 bg-amber-500/10 border-amber-500/20']
    ]);
    return colors.get(colorClass) || colors.get('purple') || '';
};

const getPulseClasses = (colorClass: string = 'purple') => {
    const pulses = new Map<string, string>([
        ['purple', 'ring-theme-purple/20 border-theme-purple/30 shadow-md shadow-theme-purple/[0.03] dark:ring-theme-purple/20 dark:border-theme-purple/30'],
        ['blue', 'ring-blue-500/20 border-blue-500/30 shadow-md shadow-blue-500/[0.03] dark:ring-blue-500/20 dark:border-blue-500/30'],
        ['red', 'ring-red-500/20 border-red-500/30 shadow-md shadow-red-500/[0.03] dark:ring-red-500/20 dark:border-red-500/30'],
        ['green', 'ring-green-500/20 border-green-500/30 shadow-md shadow-green-500/[0.03] dark:ring-green-500/20 dark:border-green-500/30'],
        ['orange', 'ring-orange-500/20 border-orange-500/30 shadow-md shadow-orange-500/[0.03] dark:ring-orange-500/20 dark:border-orange-500/30'],
        ['teal', 'ring-teal-500/20 border-teal-500/30 shadow-md shadow-teal-500/[0.03] dark:ring-teal-500/20 dark:border-teal-500/30'],
        ['amber', 'ring-amber-500/20 border-amber-500/30 shadow-md shadow-amber-500/[0.03] dark:ring-amber-400/20 dark:border-amber-400/30']
    ]);
    return pulses.get(colorClass) || pulses.get('purple') || '';
};

export function ActionCard({
    title = '',
    subtitle,
    value,
    icon,
    href,
    pulse = false,
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
            className={`w-full flex items-center gap-4 p-4 rounded-3xl bg-bg-card border border-border-color shadow-sm relative overflow-hidden
                ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : ''} 
                ${!disabled && href ? 'hover:border-theme-purple/40 hover:bg-theme-purple/[0.02] hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group' : ''}
                ${pulse ? `ring-1 ${getPulseClasses(colorClass)}` : ''}`}
        >
            {icon && (
                <div className={`p-3 rounded-xl transition-colors ${colorStyle} group-hover:bg-opacity-20 shrink-0 ${pulse ? 'animate-pulse' : ''}`}>
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-6 w-6' }) : icon}
                </div>
            )}

            <div className="text-left flex-1 min-w-0 pr-2">
                <p className="text-base font-semibold tracking-normal text-text-main group-hover:text-theme-purple transition-colors leading-tight mb-1 truncate">
                    {title}
                </p>
                {subtitle && (
                    <p className="font-medium text-base text-text-muted truncate leading-tight opacity-60">
                        {subtitle}
                    </p>
                )}
            </div>

            {value !== undefined && (
                <div className="shrink-0 flex flex-col items-end">
                    <span className="text-2xl font-semibold tracking-normal text-text-main opacity-80 group-hover:opacity-100 group-hover:text-theme-purple transition-all">
                        {value}
                    </span>
                </div>
            )}

            {isLink && (
                <div className="text-theme-purple opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all pr-1">
                    <ChevronRight className="h-5 w-5" />
                </div>
            )}
        </Component>
    );
}