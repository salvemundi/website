'use client';

import Link from 'next/link';
import { ShieldAlert, Home, Mail } from 'lucide-react';
import PageHeader from '@/widgets/page-header/ui/PageHeader';

export default function NoAccessPage() {
    return (
        <>
            <PageHeader
                title="Geen Toegang"
                description="Je hebt geen toegang tot het admin panel"
            />
            
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-6">
                            <ShieldAlert className="h-16 w-16 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                        Toegang Geweigerd
                    </h1>
                    
                    <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                        Het admin panel is alleen toegankelijk voor commissieleden. Je bent momenteel geen lid van een commissie.
                    </p>
                    
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 mb-8 text-left">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Interesse in een commissie?
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">
                            Als je interesse hebt om deel uit te maken van een commissie, neem dan contact op met het bestuur via{' '}
                            <a 
                                href="mailto:bestuur@salvemundi.nl" 
                                className="text-theme-purple hover:text-theme-purple-dark dark:text-theme-purple-light dark:hover:text-theme-purple font-medium"
                            >
                                bestuur@salvemundi.nl
                            </a>
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-theme-purple hover:bg-theme-purple-dark text-white px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                        >
                            <Home className="h-5 w-5" />
                            Terug naar Home
                        </Link>
                        
                        <Link
                            href="/commissies"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white dark:bg-slate-700 text-theme-purple dark:text-theme-purple-light border-2 border-theme-purple dark:border-theme-purple-light px-6 py-3 font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                        >
                            Bekijk Commissies
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
