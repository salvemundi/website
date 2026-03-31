import React from 'react';
import Link from 'next/link';

export function ActionCard({
    title,
    subtitle,
    icon,
    href,
    colorClass = 'purple',
    disabled = false
}: {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    href?: string;
    colorClass?: 'purple' | 'blue' | 'red' | 'green' | 'orange' | 'teal' | 'amber';
    disabled?: boolean;
}) {
    const isLink = !disabled && href;
    const Component = (isLink ? Link : 'div') as any;
    
    // Mapping color classes to beheer-accent or other semantic colors if possible, 
    // but Keeping some specific tints for variety while using the token system.
    const colorMap: Record<string, string> = {
        purple: 'text-[var(--beheer-accent)] bg-[var(--beheer-accent)]/5 border-[var(--beheer-accent)]/10',
        blue: 'text-blue-500 bg-blue-500/5 border-blue-500/10',
        red: 'text-red-500 bg-red-500/5 border-red-500/10',
        green: 'text-green-500 bg-green-500/5 border-green-500/10',
        orange: 'text-orange-500 bg-orange-500/5 border-orange-500/10',
        teal: 'text-teal-500 bg-teal-500/5 border-teal-500/10',
        amber: 'text-amber-500 bg-amber-500/5 border-amber-500/10'
    };

    return (
        <Component
            {...((isLink && href) ? { href } : {})}
            className={`w-full flex items-center gap-4 p-4 rounded-[var(--beheer-radius)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : 'hover:border-[var(--beheer-accent)]/30 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group'}`}
        >
            <div className={`p-3 rounded-xl transition-colors ${colorMap[colorClass] || colorMap.purple} group-hover:bg-opacity-10`}>
                {icon}
            </div>
            <div className="text-left flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] transition-colors">{title}</p>
                {subtitle && <p className="font-black text-lg text-[var(--beheer-text)] uppercase tracking-tighter truncate">{subtitle}</p>}
            </div>
        </Component>
    );
}

export function StatCard({
    title,
    value,
    icon,
    subtitle,
    href,
    colorClass = 'purple',
    nowrap = false,
    disabled = false
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtitle?: string;
    href?: string;
    colorClass?: 'purple' | 'orange' | 'blue' | 'green' | 'red' | 'amber' | 'teal';
    nowrap?: boolean;
    disabled?: boolean;
}) {
    const isLink = !disabled && href;
    const Component = (isLink ? Link : 'div') as any;

    const colors: Record<string, string> = {
        purple: 'text-[var(--beheer-accent)] bg-[var(--beheer-accent)]/5',
        orange: 'text-orange-500 bg-orange-500/5',
        blue: 'text-blue-500 bg-blue-500/5',
        green: 'text-green-500 bg-green-500/5',
        red: 'text-red-500 bg-red-500/5',
        amber: 'text-amber-500 bg-amber-500/5',
        teal: 'text-teal-500 bg-teal-500/5',
    };

    const color = colors[colorClass] || colors.purple;

    return (
        <Component
            {...((isLink && href) ? { href } : {})}
            className={`block w-full bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] p-5 relative overflow-hidden transition-all ${!disabled && href ? 'hover:shadow-lg hover:border-[var(--beheer-accent)]/30 hover:-translate-y-1 group cursor-pointer' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl ${color}`}>
                        {icon}
                    </div>
                    {isLink && <div className="text-[10px] font-black text-[var(--beheer-accent)] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Bekijken →</div>}
                </div>
                
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">{title}</p>
                    <p className="text-3xl font-black text-[var(--beheer-text)] tracking-tighter uppercase truncate">
                        {value}
                    </p>
                    {subtitle && <p className="text-[10px] font-bold text-[var(--beheer-text-muted)] uppercase tracking-widest truncate">{subtitle}</p>}
                </div>
            </div>
        </Component>
    );
}

export function ListCard({
    title,
    icon,
    children
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] shadow-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-[var(--beheer-accent)]/10 p-2 rounded-xl text-[var(--beheer-accent)]">
                        {icon}
                    </div>
                    <h3 className="text-sm font-black text-[var(--beheer-text)] uppercase tracking-widest">{title}</h3>
                </div>
            </div>
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
}
