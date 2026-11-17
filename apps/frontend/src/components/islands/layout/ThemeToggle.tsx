'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggle = () => {
        const html = document.documentElement;

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

        const _ = window.getComputedStyle(css).opacity;

        requestAnimationFrame(() => {
            css.remove();
        });
    };

    if (!mounted) {
        return (
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-transparent"
                aria-hidden="true"
            >
                <Sun className="size-5" />
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={isDark ? 'Schakel naar lichte modus' : 'Schakel naar donkere modus'}
        >
            {isDark ? (
                <Sun className="size-5" aria-hidden />
            ) : (
                <Moon className="size-5" aria-hidden />
            )}
        </Button>
    );
}
