'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface AnimatedBeheerHeaderProps {
    title: string;
    subtitle?: string;
    backLink?: string;
    icon?: React.ReactNode;
}

export default function AnimatedBeheerHeader({ 
    title, 
    subtitle, 
    backLink, 
    icon 
}: AnimatedBeheerHeaderProps) {
    return (
        <header className="bg-[var(--beheer-card-bg)] border-b border-[var(--beheer-border)] mb-10 overflow-hidden relative">
            {/* Subtle background glow */}
            <div className="absolute -top-24 -right-24 h-64 w-64 bg-[var(--beheer-accent)]/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="container mx-auto px-4 py-16 max-w-7xl relative z-10">
                {backLink && (
                    <Link 
                        href={backLink}
                        className="inline-flex items-center gap-2 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] transition-all mb-8 group no-underline"
                    >
                        <div className="h-8 w-8 rounded-lg bg-[var(--beheer-border)]/20 flex items-center justify-center group-hover:bg-[var(--beheer-accent)]/10 transition-colors">
                            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        </div>
                        <span className="text-base font-semibold tracking-wider">Terug</span>
                    </Link>
                )}

                <div className="flex flex-col md:flex-row md:items-center gap-8">
                    {icon && (
                        <div className="h-20 w-20 rounded-[var(--radius-3xl)] bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center shadow-2xl shadow-[var(--beheer-accent)]/20 animate-in zoom-in-50 duration-700 relative group">
                            <div className="absolute inset-0 rounded-[var(--radius-3xl)] bg-[var(--beheer-accent)]/20 animate-pulse " />
                            <div className="relative z-10 group-hover:scale-110 transition-transform duration-500">
                                {icon}
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 animate-in slide-in-from-left-8 duration-700">
                            <h1 className="text-5xl md:text-6xl font-bold text-[var(--beheer-text)] tracking-tight leading-none">
                                {title.split(' ').map((word, i) => (
                                    <span key={i} className={i === title.split(' ').length - 1 ? 'text-[var(--beheer-accent)]' : ''}>
                                        {word}{' '}
                                    </span>
                                ))}
                            </h1>
                        </div>
                        
                        {subtitle && (
                            <p className="text-[var(--beheer-text-muted)] text-xl max-w-3xl leading-relaxed font-medium animate-in slide-in-from-left-12 duration-1000 delay-100">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
