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
        <section className={`relative overflow-hidden squircle-xl border border-transparent bg-(--bg-card) shadow-lg dark:border-white/10 ${className}`}>
            <div className="relative p-6 sm:p-8">
                {(title || actions) && (
                    <header className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            {icon && (
                                <div className="flex shrink-0 items-center justify-center text-theme-purple">
                                    {icon}
                                </div>
                            )}
                            {title && (
                                <h2 className="min-w-0 text-xl font-bold wrap-break-word whitespace-normal text-theme-purple sm:text-2xl">
                                    {title}
                                </h2>
                            )}
                        </div>
                        {actions && <div className="flex w-full justify-start sm:w-auto sm:justify-end">{actions}</div>}
                    </header>
                )}
                <div className="text-(--text-main)">{children}</div>
            </div>
        </section>
    );
}

interface QuickLinkProps {
    label: string;
    subtitle?: string;
    icon: React.ReactNode;
    onClick?: () => void;
    href?: string;
    locked?: boolean;
    external?: boolean;
}

export function QuickLink({
    label, subtitle, icon, onClick, href, locked, external
}: QuickLinkProps) {
    const common = "group flex items-center gap-4 squircle bg-licht-paars/10 dark:bg-white/5 p-5 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-300 border border-licht-paars/20 dark:border-white/10 hover:border-purple-300 shadow-sm w-full";

    const inner = (
        <>
            <div className="flex shrink-0 items-center justify-center text-theme-purple">
                {icon}
            </div>
            <span className="flex flex-1 items-center justify-between text-sm font-bold text-theme-purple">
                <div className="flex flex-col items-start gap-0.5">
                    <span>{label}</span>
                    {subtitle && <span className="text-[10px] leading-none font-medium text-theme-purple opacity-80">{subtitle}</span>}
                </div>
                <div className="flex items-center gap-2">
                    {locked && <Lock className="size-3 opacity-50" />}
                    {external && <ExternalLink className="size-3 opacity-50" />}
                    <ChevronRight className="size-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
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
    return <button type="button" onClick={onClick} className={`form-button ${common}`}>{inner}</button>;
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
