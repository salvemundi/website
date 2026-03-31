'use client';

import React from 'react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import { PenTool, Construction } from 'lucide-react';

export default function BlogsPage() {
    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <AdminToolbar 
                title="Intro Blogs"
                subtitle="Beheer de blogposts voor de Introductieweek"
                backHref="/beheer/intro"
            />
            
            <div className="container mx-auto px-4 py-32 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-16 max-w-2xl mx-auto shadow-xl flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center mb-8 shadow-inner ring-4 ring-[var(--beheer-accent)]/5">
                        <PenTool className="h-12 w-12" />
                    </div>
                    
                    <h1 className="text-3xl font-black text-[var(--beheer-text)] uppercase tracking-tighter mb-4">
                        Blogs Editor
                    </h1>
                    
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--beheer-text-muted)] mb-10">
                        Module onder constructie
                    </p>
                    
                    <div className="flex items-center gap-3 bg-[var(--bg-main)] px-8 py-4 rounded-2xl border border-[var(--beheer-border)] text-amber-500 shadow-sm">
                        <Construction className="h-5 w-5 animate-bounce" />
                        <span className="text-xs font-black uppercase tracking-widest leading-none">Binnenkort Beschikbaar</span>
                    </div>
                    
                    <div className="mt-12 text-[var(--beheer-text-muted)] text-[10px] font-medium opacity-40 uppercase tracking-widest leading-relaxed max-w-sm">
                        Deze module wordt momenteel ontwikkeld om directe bewerking van de introductie-blogs mogelijk te maken via Directus.
                    </div>
                </div>
            </div>
        </main>
    );
}
