'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Lock, ExternalLink } from 'lucide-react';

interface TileProps {
    title?: string; 
    icon?: React.ReactNode; 
    children: React.ReactNode;
    className?: string; 
    actions?: React.ReactNode;
}

export function Tile({
    title, icon, children, className = "", actions
}: TileProps) {
    return (
        <section className={`relative overflow-hidden rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 shadow-lg ${className}`}>
            <div className="relative p-6 sm:p-8">
                {(title || actions) && (
                    <header className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            {icon && (
                                <div className="shrink-0 rounded-2xl bg-[var(--color-purple-100)] p-2.5 text-[var(--color-purple-700)] dark:text-[var(--color-purple-300)]">
                                    {icon}
                                </div>
                            )}
                            {title && (
                                <h2 className="min-w-0 break-words whitespace-normal text-xl sm:text-2xl font-bold text-[var(--color-purple-700)] dark:text-white">
                                    {title}
                                </h2>
                            )}
                        </div>
                        {actions && <div className="w-full sm:w-auto flex justify-start sm:justify-end">{actions}</div>}
                    </header>
                )}
                <div className="text-[var(--text-main)]">{children}</div>
            </div>
        </section>
    );
}

interface QuickLinkProps {
    label: string; 
    icon: React.ReactNode; 
    onClick?: () => void;
    href?: string; 
    locked?: boolean; 
    external?: boolean;
}

export function QuickLink({
    label, icon, onClick, href, locked, external
}: QuickLinkProps) {
    const common = "group flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-black/20 p-5 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-purple-300)] border border-slate-200 dark:border-white/10 hover:border-[var(--color-purple-300)] shadow-sm w-full hover:-translate-y-0.5";
    const inner = (
        <>
            <div className="rounded-xl bg-[var(--color-purple-100)] p-2.5 text-[var(--color-purple-700)] dark:text-[var(--color-purple-300)] transition-transform group-hover:scale-110 shadow-sm">
                {icon}
            </div>
            <span className="flex-1 flex items-center justify-between text-sm font-bold text-[var(--color-purple-700)] dark:text-white">
                <span>{label}</span>
                <div className="flex items-center gap-2">
                    {locked && <Lock className="h-3 w-3 opacity-50" />}
                    {external && <ExternalLink className="h-3 w-3 opacity-50" />}
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </div>
            </span>
        </>
    );

    if (href) {
        return (
            <Link href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={common}>
                {inner}
            </Link>
        );
    }
    return <button type="button" onClick={onClick} className={common}>{inner}</button>;
}

export const formatForBreak = (text: string | null | undefined) => {
    if (!text) return null;
    return text.split('').map((char, i) => (
        <span key={i}>
            {char}
            {(char === '@' || char === '.' || char === '-' || char === '_') && <wbr />}
        </span>
    ));
};
