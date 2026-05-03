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
        <div className="pt-6">
            <button
                onClick={() => router.push('/safe-havens')}
                className="w-full bg-[var(--bg-main)] text-[var(--text-main)] rounded-2xl p-6 font-semibold hover:-translate-y-0.5 transition-all shadow-lg flex items-center justify-between group border border-[var(--border-color)]/20"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-purple-50)] text-[var(--color-purple-500)] flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Shield className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-bold">Safe Havens</div>
                        <div className="text-base text-[var(--text-muted)] opacity-70">
                            Veilig aanspreekpunt voor hulp
                        </div>
                    </div>
                </div>
                {/* Pijl-animatie op hover */}
                <ChevronRight className="h-6 w-6 text-[var(--color-purple-500)] group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
