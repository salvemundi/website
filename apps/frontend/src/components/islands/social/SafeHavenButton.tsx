'use client';

import { useRouter } from 'next/navigation';
import { Shield, ChevronRight } from 'lucide-react';

/**
 * Interactieve knop die navigeert naar de Safe Havens pagina.
 * Gescheiden als island zodat page.tsx een pure server-component blijft.
 */
export default function SafeHavenButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push('/safe-havens')}
            className="flex items-center gap-5 p-5 rounded-2xl bg-bg-card border border-border-color shadow-sm transition-all duration-300 w-full text-left hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group"
        >
            <div className="w-12 h-12 rounded-xl bg-purple-500/5 dark:bg-purple-400/5 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/10 dark:border-purple-400/10">
                <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-theme-purple text-lg font-black leading-tight">
                    Safe Havens
                </h4>
                <p className="text-text-muted text-base mt-1">
                    Veilig aanspreekpunt voor hulp
                </p>
            </div>
            <ChevronRight className="h-5 w-5 text-purple-300 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
    );
}
