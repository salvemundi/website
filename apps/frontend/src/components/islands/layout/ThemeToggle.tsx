'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';

export function ThemeToggle() {
    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: true });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = computedColorScheme === 'dark';

    if (!mounted) {
        return (
            <ActionIcon size="lg" aria-label="Thema wisselen" aria-hidden="true">
                <Sun size={20} />
            </ActionIcon>
        );
    }

    return (
        <ActionIcon
            size="lg"
            onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Schakel naar lichte modus' : 'Schakel naar donkere modus'}
        >
            {isDark ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
        </ActionIcon>
    );
}
