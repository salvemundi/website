'use client';

import React, { createContext, useContext } from 'react';

interface GuardAccessContextType {
    canToggleVisibility: boolean;
}

const GuardAccessContext = createContext<GuardAccessContextType>({
    canToggleVisibility: false
});

export function GuardAccessClientProvider({
    children,
    canToggleVisibility
}: {
    children: React.ReactNode;
    canToggleVisibility: boolean;
}) {
    return (
        <GuardAccessContext.Provider value={{ canToggleVisibility }}>
            {children}
        </GuardAccessContext.Provider>
    );
}

export function useGuardAccess() {
    return useContext(GuardAccessContext);
}