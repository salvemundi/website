"use client";

import { useState, useEffect } from 'react';

/**
 * CLIENT HOOK: Provides hydration safety by tracking if the component has mounted.
 * Use this in Client Islands that require browser-specific logic to prevent hydration mismatches.
 */
export function useIsMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    return mounted;
}
