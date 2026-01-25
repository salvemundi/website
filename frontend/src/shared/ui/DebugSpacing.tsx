'use client';

import { useEffect, useState } from 'react';

/**
 * A utility component that toggles a debug overlay showing padding/margins
 * when pressing Alt + Shift + D.
 */
export default function DebugSpacing() {
    const [debug, setDebug] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.shiftKey && e.key === 'D') {
                setDebug(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!debug) return null;

    return (
        <style dangerouslySetInnerHTML={{
            __html: `
            section, .max-w-app, .container {
                outline: 1px dashed rgba(255, 0, 0, 0.5) !important;
                outline-offset: -1px;
                position: relative;
            }
            
            section::before {
                content: attr(class);
                position: absolute;
                top: 0;
                left: 0;
                background: rgba(255, 0, 0, 0.8);
                color: white;
                font-size: 10px;
                padding: 2px 4px;
                z-index: 1000;
                pointer-events: none;
            }

            [class*="py-"], [class*="pt-"], [class*="pb-"] {
                background-color: rgba(255, 0, 0, 0.05) !important;
            }
        ` }} />
    );
}
