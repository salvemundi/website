'use client';

import { Download } from 'lucide-react';
import ToastHeader from './ToastHeader';

interface NativeToastProps {
    onInstall: () => void;
    onDismiss: () => void;
    installing: boolean;
}

export default function NativeToast({ onInstall, onDismiss, installing }: NativeToastProps) {
    return (
        <>
            <ToastHeader onDismiss={onDismiss} />
            <div style={{
                padding: '0 1.125rem 1rem',
                display: 'flex', gap: '0.625rem'
            }}>
                <button
                    id="pwa-install-btn"
                    onClick={onInstall}
                    disabled={installing}
                    aria-label="Installeer de Salve Mundi app"
                    style={{
                        flex: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        background: installing
                            ? 'rgba(164,83,155,0.35)'
                            : 'linear-gradient(135deg, #a4539b, #8c4682)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        padding: '0.7rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: installing ? 'default' : 'pointer',
                        boxShadow: installing ? 'none' : '0 3px 10px rgba(164,83,155,0.4)',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit'
                    }}
                >
                    <Download size={15} />
                    {installing ? 'Bezig…' : 'Voeg toe aan beginscherm'}
                </button>
            </div>
        </>
    );
}
