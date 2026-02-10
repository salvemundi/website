'use client';

import { useEffect } from 'react';
import { preventZoom } from '@/shared/lib/prevent-zoom';

/**
 * Component to prevent zoom on mobile devices
 * Especially important for Android devices where users can zoom out too far
 */
export function PreventZoom() {
  useEffect(() => {
    preventZoom();
  }, []);

  return null;
}
