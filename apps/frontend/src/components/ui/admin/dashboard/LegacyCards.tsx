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
    const colorMap: Record<string, string> = {
        purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
        blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
        red: 'bg-gradient-to-br from-red-500 to-red-600',
        green: 'bg-gradient-to-br from-green-500 to-green-600',
        orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
        teal: 'bg-gradient-to-br from-teal-500 to-teal-600',
        amber: 'bg-gradient-to-br from-amber-500 to-amber-600'
    };

    return (
        <Component
            {...((isLink && href) ? { href } : {})}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl shadow-sm ${colorMap[colorClass]} text-white ${disabled ? 'opacity-60 cursor-not-allowed hover:scale-100' : 'hover:scale-[1.01] transition cursor-pointer'}`}
        >
            <div className={`${disabled ? 'p-2 bg-white/10' : 'p-2 bg-white/20'} rounded-lg flex items-center justify-center`}>{icon}</div>
            <div className="text-left">
                <p className="text-sm opacity-90">{title}</p>
                {subtitle && <p className="font-bold text-lg">{subtitle}</p>}
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

    const colorStyles = {
        purple: { gradient: 'from-purple-500 to-purple-600', iconBg: 'bg-white/20', text: 'text-white', subtitleText: 'text-purple-100' },
        orange: { gradient: 'from-orange-500 to-orange-600', iconBg: 'bg-white/20', text: 'text-white', subtitleText: 'text-orange-100' },
        amber: { gradient: 'from-amber-500 to-amber-600', iconBg: 'bg-white/20', text: 'text-white', subtitleText: 'text-amber-100' },
        teal: { gradient: 'from-teal-500 to-teal-600', iconBg: 'bg-white/20', text: 'text-white', subtitleText: 'text-teal-100' },
        blue: { gradient: 'from-blue-500 to-blue-600', iconBg: 'bg-white/20', text: 'text-white', subtitleText: 'text-blue-100' },
        green: { gradient: 'from-green-500 to-green-600', iconBg: 'bg-white/20', text: 'text-white', subtitleText: 'text-green-100' },
        red: { gradient: 'from-red-500 to-red-600', iconBg: 'bg-white/20', text: 'text-white', subtitleText: 'text-red-100' }
    };

    const colors = colorStyles[colorClass] || colorStyles.purple;

    return (
        <Component
            {...((isLink && href) ? { href } : {})}
            className={`block w-full bg-gradient-to-br ${colors.gradient} rounded-2xl shadow-lg p-4 sm:p-6 relative overflow-hidden ${!disabled && href ? 'hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-1 hover:scale-[1.02]' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
            <div className={`absolute top-0 right-0 w-28 h-28 sm:w-32 sm:h-32 -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 bg-white/10 rounded-full`} />
            <div className="relative z-10">
                <div className={`${nowrap ? 'flex flex-row items-center justify-between gap-2' : 'flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3'} min-h-0`}>
                    <div className={`flex-1 min-w-0 text-center sm:text-left sm:pr-2`}>
                        <p className={`${colors.subtitleText} text-sm font-medium mb-2`}>{title}</p>
                        <p className={`${typeof value === 'string' && value.length > 10 ? 'text-lg sm:text-xl' : 'text-3xl sm:text-4xl'} font-bold ${colors.text} mb-1 ${nowrap ? 'whitespace-normal sm:whitespace-nowrap' : 'break-words'}`}>{value}</p>
                        {subtitle && <p className={`${colors.subtitleText} text-xs line-clamp-2`} title={subtitle}>{subtitle}</p>}
                    </div>
                    <div className={`hidden sm:block ${colors.iconBg} p-3 rounded-xl ${colors.text} backdrop-blur-sm flex-shrink-0 relative -mt-3 sm:-mt-4 z-20 self-start`}>
                        {icon}
                    </div>
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-theme-purple/10 dark:bg-purple-500/20 p-2 rounded-xl text-purple-600 dark:text-purple-400">
                    {icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            </div>
            {children}
        </div>
    );
}
