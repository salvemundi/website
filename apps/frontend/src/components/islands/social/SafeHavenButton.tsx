'use client';

import { useRouter } from 'next/navigation';
import { Shield, ChevronRight } from 'lucide-react';

export default function SafeHavenButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push('/safe-havens')}
            className="group form-button flex w-full cursor-pointer items-center gap-5 rounded-2xl border border-border-color bg-bg-card p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
        >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-purple-500/10 bg-purple-500/5 text-purple-700 dark:border-purple-400/10 dark:bg-purple-400/5 dark:text-purple-300">
                <Shield className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
                <h4 className="text-lg leading-tight font-black text-theme-purple">
                    Safe Havens
                </h4>
                <p className="mt-1 text-base text-text-muted">
                    Veilig aanspreekpunt voor hulp
                </p>
            </div>
            <ChevronRight className="size-5 text-purple-300 opacity-50 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
        </button>
    );
}
