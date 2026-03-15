'use client';

import { useRouter } from 'next/navigation';

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
                className="w-full bg-[var(--gradient-start)] text-[var(--text-main)] rounded-2xl p-6 font-semibold hover:-translate-y-0.5 transition-all shadow-lg flex items-center justify-between group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl" aria-hidden="true">⚡️</span>
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-bold">Safe Havens</div>
                        <div className="text-[var(--font-size-sm)] text-[var(--text-muted)]">
                            Veilig aanspreekpunt voor hulp
                        </div>
                    </div>
                </div>
                {/* Pijl-animatie op hover */}
                <span className="text-2xl group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
            </button>
        </div>
    );
}
