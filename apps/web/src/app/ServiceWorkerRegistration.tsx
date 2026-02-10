'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/register-sw';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Register service worker after initial render
    // Always register in production, and in development if notifications are supported
    if (process.env.NODE_ENV === 'production' || 
        (typeof window !== 'undefined' && 'serviceWorker' in navigator)) {
      registerServiceWorker();
    }
  }, []);

  return null;
}
