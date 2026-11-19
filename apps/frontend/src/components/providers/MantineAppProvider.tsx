'use client';

import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { salveMundiTheme, salveMundiCssResolver } from '@/lib/config/theme';

export function MantineAppProvider({ children }: { children: ReactNode }) {
    return (
        <MantineProvider
            theme={salveMundiTheme}
            cssVariablesResolver={salveMundiCssResolver}
            defaultColorScheme="dark"
        >
            <Notifications />
            {children}
        </MantineProvider>
    );
}
