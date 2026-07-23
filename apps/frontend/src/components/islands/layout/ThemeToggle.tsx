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

        // Inverteer transities tijdens de theme-wissel om 'lag' en niet-synchrone transities te voorkomen
        const css = document.createElement('style');
        css.type = 'text/css';
        css.appendChild(
            document.createTextNode(
                `* {
                    -webkit-transition: none !important;
                    -moz-transition: none !important;
                    -o-transition: none !important;
                    -ms-transition: none !important;
                    transition: none !important;
                }`
            )
        );
        document.head.appendChild(css);

        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }

        // Forceer een reflow, zodat de browser de nieuwe kleuren direct rendert
        const _ = window.getComputedStyle(css).opacity;

        // Verwijder de style tag na de volgende frame
        requestAnimationFrame(() => {
            css.remove();
        });
    };

    // Voorkom hydration mismatch: render een stabiele knoppen-shell
    // met exact dezelfde afmetingen totdat de client weet wek thema actief is.
    if (!mounted) {
        return (
            <button
                type="button"
                className="icon-button inline-flex items-center justify-center rounded-full bg-(--bg-card)/80 p-2 h-9 w-9 text-transparent shadow-sm"
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
            className="icon-button inline-flex items-center justify-center rounded-full bg-(--bg-card)/80 p-2 h-9 w-9 text-(--text-main) shadow-sm transition-transform duration-200 hover:scale-110 active:scale-95 hover:bg-purple-100 dark:hover:bg-white/10"
        >
            {isDark ? (
                <Sun className="h-5 w-5" aria-hidden />
            ) : (
                <Moon className="h-5 w-5" aria-hidden />
            )}
        </button>
    );
}
