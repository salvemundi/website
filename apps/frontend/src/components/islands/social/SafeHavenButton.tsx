'use client';

import { useRouter } from 'next/navigation';
import { Shield, ChevronRight } from 'lucide-react';

export default function SafeHavenButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push('/safe-havens')}
            className="group form-button w-full gap-4 border border-border-color bg-bg-card p-5 text-left shadow-xs duration-300 hover:-translate-y-0.5 hover:border-theme-purple/40 hover:shadow-md"
            type="button">
            <div className="shrink-0 text-theme-purple">
                <Shield className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
                <h4 className="text-lg leading-tight font-black text-theme-purple">
                    Safe Havens
                </h4>
                <p className="mt-1 text-sm text-text-muted">
                    Veilig aanspreekpunt voor hulp
                </p>
            </div>
            <ChevronRight className="size-5 text-theme-purple opacity-40 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
        </button>
    );
}
