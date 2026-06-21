'use client';

import { Loader2 } from 'lucide-react';

export default function StatusLoading() {
    return (
        <div className="py-20 text-center space-y-8 animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-(--theme-purple)/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-(--theme-purple)/20">
                <Loader2 className="h-12 w-12 text-(--theme-purple) animate-spin" />
            </div>
            <div className="space-y-2">
                <h2 className="text-4xl font-semibold text-(--text-main) tracking-tighter italic">
                    Betaling <span className="text-(--theme-purple)">verifiëren</span>
                </h2>
                <p className="text-(--text-muted) text-lg font-medium max-w-sm mx-auto">
                    Eén moment geduld, we controleren de status van je transactie bij de bank...
                </p>
            </div>
        </div>
    );
}
