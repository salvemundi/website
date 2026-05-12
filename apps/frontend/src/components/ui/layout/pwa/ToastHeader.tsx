'use client';

import { Smartphone, X } from 'lucide-react';

export default function ToastHeader({ onDismiss }: { onDismiss: () => void }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.125rem' }}>
            <div style={{
                flexShrink: 0,
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #a4539b, #75386a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(164,83,155,0.45)'
            }}>
                <Smartphone size={20} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#fff', lineHeight: 1.3 }}>
                    Installeer de app
                </p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.775rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                    Snellere toegang, werkt ook offline
                </p>
            </div>
            <button
                id="pwa-dismiss-btn"
                onClick={onDismiss}
                aria-label="Melding een week verbergen"
                title="Een week niet tonen"
                style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.5rem',
                    width: '2rem', height: '2rem',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    fontFamily: 'inherit'
                }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.16)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
                }}
            >
                <X size={14} />
            </button>
        </div>
    );
}
