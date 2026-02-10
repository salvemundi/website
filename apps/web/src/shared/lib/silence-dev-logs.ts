'use client';

// Suppress noisy dev-server logs (HMR / Fast Refresh) from appearing in the browser console
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const patterns: RegExp[] = [
        /^\[HMR\]/i,
        /\[Fast Refresh\]/i,
        /forward-logs-shared/i,
    ];

    const shouldFilter = (args: any[]) => {
        try {
            const text = args.map(a => {
                if (typeof a === 'string') return a;
                try { return JSON.stringify(a); } catch { return String(a); }
            }).join(' ');
            return patterns.some((p) => p.test(text));
        } catch (e) {
            return false;
        }
    };

    const wrap = (orig: (...args: any[]) => void) => {
        return (...args: any[]) => {
            if (shouldFilter(args)) return;
            return orig.apply(console, args);
        };
    };

    // Patch common console methods
    console.log = wrap(console.log.bind(console));
    console.info = wrap(console.info.bind(console));
    console.debug = wrap(console.debug.bind(console));
}
