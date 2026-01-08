"use client";

import React, { ReactNode, useEffect, useState } from 'react';

export default function ClientOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (document.readyState === 'complete') {
            setReady(true);
            return;
        }

        const onLoad = () => setReady(true);
        window.addEventListener('load', onLoad);
        return () => window.removeEventListener('load', onLoad);
    }, []);

    if (!ready) {
        return (
            <div className="min-h-screen flex items-center justify-center" aria-busy="true">
                {fallback ?? <span className="text-theme-muted">Loading…</span>}
            </div>
        );
    }

    return <>{children}</>;
}
