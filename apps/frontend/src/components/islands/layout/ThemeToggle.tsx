'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

// Thema-schakelaar: wisselt tussen light en dark mode via class op <html>
export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Initiële waarde uit DOM lezen na mount
        setMounted(true);
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggle = () => {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    // Voorkom hydration mismatch: render een stabiele knoppen-shell
    // met exact dezelfde afmetingen totdat de client weet wek thema actief is.
    if (!mounted) {
        return (
            <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-[var(--bg-card)]/80 p-2 h-9 w-9 text-transparent shadow-sm"
                aria-hidden="true"
            >
                <Sun className="h-5 w-5" />
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? 'Schakel naar lichte modus' : 'Schakel naar donkere modus'}
            className="inline-flex items-center justify-center rounded-full bg-[var(--bg-card)]/80 p-2 h-9 w-9 text-[var(--text-main)] shadow-sm transition hover:bg-[var(--color-purple-100)]"
        >
            {isDark ? (
                <Sun className="h-5 w-5" aria-hidden />
            ) : (
                <Moon className="h-5 w-5" aria-hidden />
            )}
        </button>
    );
}
