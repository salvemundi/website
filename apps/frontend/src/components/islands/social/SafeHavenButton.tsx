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
            className="flex items-center gap-5 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm transition-all duration-300 w-full text-left hover:border-[var(--color-purple-300)] hover:shadow-md hover:-translate-y-0.5 cursor-pointer group"
        >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-purple-50)] text-[var(--color-purple-500)] flex items-center justify-center flex-shrink-0 shadow-inner">
                <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-[var(--text-main)] text-lg font-bold leading-tight">
                    Safe Havens
                </h4>
                <p className="text-[var(--text-muted)] text-base mt-1">
                    Veilig aanspreekpunt voor hulp
                </p>
            </div>
            <ChevronRight className="h-5 w-5 text-[var(--color-purple-300)] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
    );
}
