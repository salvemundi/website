'use client';

export default function ToastWrapper({ children, visible }: { children: React.ReactNode; visible: boolean }) {
    return (
        <div
            role="dialog"
            aria-modal="false"
            aria-label="App installeren"
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                width: 'min(calc(100vw - 2rem), 440px)',
                pointerEvents: visible ? 'auto' : 'none',
                opacity: visible ? 1 : 0
            }}
        >
            <div style={{
                background: 'linear-gradient(145deg, rgba(75,36,72,0.97) 0%, rgba(58,27,56,0.98) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(164,83,155,0.3)',
                borderRadius: '1.375rem',
                boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(164,83,155,0.08), inset 0 1px 0 rgba(255,255,255,0.07)',
                overflow: 'hidden'
            }}>
                {children}
            </div>
        </div>
    );
}
