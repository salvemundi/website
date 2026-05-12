'use client';

import React from 'react';

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

export const formatForBreak = (text: string | null | undefined) => {
    if (!text) return null;
    return text.split('').map((char, i) => (
        <span key={i}>
            {char}
            {(char === '@' || char === '.' || char === '-' || char === '_') && <wbr />}
        </span>
    ));
};

