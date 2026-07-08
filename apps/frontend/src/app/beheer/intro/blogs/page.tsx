import React from 'react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import { PenTool, Construction } from 'lucide-react';

export default async function BlogsPage() {
    return (
        <div className="w-full">
            <AdminToolbar 
                title="Intro Blogs"
                backHref="/beheer/intro"
            />
            
            <div className="container mx-auto px-4 py-32 text-center">
                <div className="bg-bg-card rounded-3xl border border-border-color p-16 max-w-2xl mx-auto shadow-xl flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-theme-purple/10 text-theme-purple flex items-center justify-center mb-8 shadow-inner ring-4 ring-theme-purple/5">
                        <PenTool className="h-12 w-12" />
                    </div>
                    
                    <h1 className="text-3xl font-black text-theme-purple tracking-tighter mb-4">
                        Blogs Editor
                    </h1>
                    
                    <p className="text-base font-black tracking-[0.3em] text-text-muted mb-10">
                        Module onder constructie
                    </p>
                    
                    <div className="flex items-center gap-3 bg-(--bg-main) px-8 py-4 rounded-2xl border border-border-color text-amber-500 shadow-sm">
                        <Construction className="h-5 w-5 animate-bounce" />
                        <span className="text-base font-black tracking-widest leading-none">Binnenkort Beschikbaar</span>
                    </div>
                    
                    <div className="mt-12 text-text-muted text-base font-medium opacity-40 tracking-widest leading-relaxed max-w-sm">
                        Deze module wordt momenteel ontwikkeld om directe bewerking van de introductie-blogs mogelijk te maken via Directus.
                    </div>
                </div>
            </div>
        </div>
    );
}
