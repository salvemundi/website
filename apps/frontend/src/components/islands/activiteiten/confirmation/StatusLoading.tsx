'use client';

import { Loader2 } from 'lucide-react';

export default function StatusLoading() {
    return (
        <div className="animate-in fade-in space-y-8 py-20 text-center duration-500">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-(--theme-purple)/10 ring-1 ring-(--theme-purple)/20">
                <Loader2 className="size-12 animate-spin text-(--theme-purple)" />
            </div>
            <div className="space-y-2">
                <h2 className="text-4xl font-semibold tracking-tighter text-(--text-main) italic">
                    Betaling <span className="text-(--theme-purple)">verifiëren</span>
                </h2>
                <p className="mx-auto max-w-sm text-lg font-medium text-(--text-muted)">
                    Eén moment geduld, we controleren de status van je transactie bij de bank...
                </p>
            </div>
        </div>
    );
}
