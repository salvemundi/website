'use client';

/**
 * Prevent zoom on mobile devices, especially Android
 * This script prevents pinch-zoom while allowing normal scrolling
 */
export function preventZoom() {
  if (typeof window === 'undefined') return;

  // Only apply touch-based zoom prevention on touch-capable devices
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (!isTouchDevice) {
    // Desktop: only prevent keyboard zoom shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
        // Allow browser zoom, don't prevent
      }
    });
    return;
  }

  // Mobile/Touch devices: Prevent pinch zoom on touch devices (but allow scrolling)
  // We need to track if the user is actively pinching
  let isPinching = false;
  let lastTouchEnd = 0;

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
      isPinching = true;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1 || isPinching) {
      // Multiple touches = pinch gesture, prevent it
      e.preventDefault();
    }
    // Single-touch scrolling is allowed automatically
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    // Reset pinch state
    isPinching = false;
    
    // Prevent double-tap zoom (but allow single tap and scrolling)
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  });

  document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
  });

  document.addEventListener('gestureend', (e) => {
    e.preventDefault();
  });

  // Additional Android-specific fix: prevent zoom on input focus
  const addInputListeners = () => {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      input.addEventListener('focus', () => {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
        }
      });
    });
  };

  // Run initially and on DOM changes
  addInputListeners();
  
  // Also run after a delay to catch dynamically added inputs
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(addInputListeners);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
