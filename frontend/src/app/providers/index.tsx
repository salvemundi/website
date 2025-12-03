import type { PropsWithChildren } from 'react';
import { AppProvider } from './app-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppProvider>{children}</AppProvider>
  );
}
