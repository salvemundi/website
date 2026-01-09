'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/register-sw';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Register service worker after initial render
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }
  }, []);

  return null;
}
