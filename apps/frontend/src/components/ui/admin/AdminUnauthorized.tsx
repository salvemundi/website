'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AdminToolbar from './AdminToolbar';

interface AdminUnauthorizedProps {
    title?: string;
    description?: string;
    backHref?: string;
}

/**
 * A standardized "Unauthorized Access" view for admin pages.
 * Maintains the beheer layout consistency (toolbar) while showing an error.
 */
export default function AdminUnauthorized({
    title = 'Toegang Geweigerd',
    description = 'Je hebt geen rechten om deze sectie te bekijken. Neem contact op met de ICT-commissie als je denkt dat dit een fout is.',
    backHref = '/beheer'
}: AdminUnauthorizedProps) {
    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <AdminToolbar 
                title={title}
                subtitle="Systeemmelding"
                backHref={backHref}
            />
            
            <div className="container mx-auto px-4 py-20 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-2xl p-12 text-center border border-[var(--beheer-border)] relative overflow-hidden group">
                    {/* Decorative glow */}
                    <div className="absolute -top-24 -right-24 h-48 w-48 bg-red-500/5 blur-3xl rounded-full group-hover:bg-red-500/10 transition-colors duration-700" />
                    
                    <div className="mb-10 flex justify-center relative">
                        <div className="rounded-full bg-red-500/10 p-10 ring-8 ring-red-500/5 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-pulse">
                            <ShieldAlert className="h-24 w-24 text-red-500" />
                        </div>
                    </div>
                    
                    <h2 className="text-4xl font-black text-[var(--beheer-text)] uppercase tracking-tighter mb-6">
                        Geen Toegang
                    </h2>
                    
                    <p className="text-lg text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px] leading-relaxed mb-12">
                        {description}
                    </p>
                    
                    <div className="flex justify-center">
                        <Link 
                            href={backHref} 
                            className="inline-flex items-center justify-center gap-4 bg-[var(--beheer-accent)] text-white px-12 py-5 rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95 group"
                        >
                            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> 
                            <span>Ga Terug</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
