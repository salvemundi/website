import React, { StrictMode, useEffect, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/global.css'
import App from './App'

function MobileThemeWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const applyTheme = () => {
      if (mediaQuery.matches) {
        document.body.classList.add('mobile-home-theme');
      } else {
        document.body.classList.remove('mobile-home-theme');
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => {
      mediaQuery.removeEventListener('change', applyTheme);
      document.body.classList.remove('mobile-home-theme');
    };
  }, []);

  return <>{children}</>;
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <MobileThemeWrapper>
      <App />
    </MobileThemeWrapper>
  </StrictMode>,
)
