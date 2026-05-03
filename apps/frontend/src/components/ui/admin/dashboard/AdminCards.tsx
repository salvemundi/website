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
 * Universal Dashboard Button (ActionCard style).
 * Horizontal layout: [Icon] [Name/Label] [Value]
 * Modernized: Pure data rendering.
 */
export function ActionCard({
    title = '',
    subtitle,
    value,
    icon,
    href,
    colorClass = 'purple',
    disabled = false,
    isExternal = false
}: CardProps & {
    subtitle?: string;
    value?: string | number;
    icon?: React.ReactNode;
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
            className={`w-full flex items-center gap-4 p-4 rounded-[var(--beheer-radius)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] shadow-sm 
                ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : ''} 
                ${!disabled && href ? 'hover:border-[var(--beheer-accent)]/30 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group' : ''}`}
        >
            {/* Left: Icon */}
            <div className={`p-3 rounded-xl transition-colors ${colorStyle} group-hover:bg-opacity-20 shrink-0`}>
                {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'h-6 w-6' }) : icon}
            </div>

            {/* Middle: Text hierarchy */}
            <div className="text-left flex-1 min-w-0 pr-2">
                <p className="text-base font-semibold tracking-normal text-[var(--beheer-text)] group-hover:text-[var(--beheer-accent)] transition-colors leading-tight mb-1 truncate">
                    {title}
                </p>
            </div>

            {/* Right: Optional value/stat */}
            {value !== undefined && value !== null && (
                <div className="shrink-0 flex flex-col items-end">
                    <span className="text-2xl font-semibold italic tracking-normal text-[var(--beheer-text)] opacity-80 group-hover:opacity-100 group-hover:text-[var(--beheer-accent)] transition-all">
                        {value}
                    </span>
                </div>
            )}
            
            {/* Indicator arrow if link and NO value */}
            {isLink && (value === undefined || value === null) && (
                <div className="text-[var(--beheer-accent)] opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all pr-2">
                    <ChevronRight className="h-5 w-5" />
                </div>
            )}
        </Component>
    );
}

/**
 * Vertical List Card for Dashboard sections.
 */
export function ListCard({
    title = '',
    icon,
    children
}: {
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div 
            className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] shadow-sm p-6 overflow-hidden h-full flex flex-col"
        >
            <div className="flex items-center gap-3 mb-6 px-1">
                <div className="bg-[var(--beheer-accent)]/10 p-2 rounded-xl text-[var(--beheer-accent)]">
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'h-4 w-4' }) : icon}
                </div>
                <h3 className="text-base font-semibold text-[var(--beheer-text)] tracking-wider leading-tight whitespace-nowrap">
                    {title}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-[var(--beheer-border)] to-transparent" />
            </div>
            <div className="space-y-1 flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
}

/**
 * StatCard (Legacy variant).
 */
export function StatCard({
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
    const isLink = !disabled && href;
    const Component = (isLink ? Link : 'div') as React.ElementType;
    const colorStyle = getColorClasses(colorClass);

    return (
        <Component
            {...((isLink && href) ? { href } : {})}
            className={`block w-full bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] p-5 relative overflow-hidden transition-all 
                ${!disabled && href ? 'hover:shadow-lg hover:border-[var(--beheer-accent)]/30 hover:-translate-y-1 group cursor-pointer' : ''} 
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className="relative z-10 flex flex-col gap-4">
                <div className={`p-2.5 w-fit rounded-xl ${colorStyle} transition-colors group-hover:bg-opacity-20`}>
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'h-5 w-5' }) : icon}
                </div>
                
                <div className="space-y-0.5 mt-1">
                    <p className="text-lg font-bold text-[var(--beheer-text)] tracking-normal leading-tight group-hover:text-[var(--beheer-accent)] transition-colors">{title}</p>
                    <div className="text-2xl font-bold text-[var(--beheer-text-muted)] tracking-tight leading-none mt-1">
                        {value}
                    </div>
                </div>
            </div>
        </Component>
    );
}
