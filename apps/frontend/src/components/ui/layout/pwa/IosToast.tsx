'use client';

import { Plus, Smartphone, Share } from 'lucide-react';
import ToastHeader from './ToastHeader';

// ─── iOS Share Icon (SVG replica van het SF Symbol dat Safari gebruikt) ──────
function IosShareIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v12M8 6l4-4 4 4" />
            <path d="M4 14v6a1 1 0 001 1h14a1 1 0 001-1v-6" />
        </svg>
    );
}

const IOS_STEPS = [
    {
        id: 1,
        icon: <IosShareIcon />,
        label: 'Tik op',
        highlight: 'Deel',
        sublabel: 'de knop onderaan in Safari'
    },
    {
        id: 2,
        icon: <Plus size={18} />,
        label: 'Kies',
        highlight: 'Zet op beginscherm',
        sublabel: 'scroll omlaag in het menu'
    },
    {
        id: 3,
        icon: <Smartphone size={18} />,
        label: 'Tik op',
        highlight: 'Voeg toe',
        sublabel: 'rechts bovenin'
    },
];

export default function IosToast({ onDismiss }: { onDismiss: () => void }) {
    return (
        <>
            <ToastHeader onDismiss={onDismiss} />

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 1.125rem' }} />

            {/* Steps */}
            <div style={{ padding: '0.875rem 1.125rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <p style={{ margin: '0 0 0.375rem', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                    Hoe installeer je de app?
                </p>
                {IOS_STEPS.map((step) => (
                    <div
                        key={step.id}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '0.75rem',
                            padding: '0.625rem 0.875rem'
                        }}
                    >
                        {/* Step number */}
                        <div style={{
                            flexShrink: 0,
                            width: '1.5rem', height: '1.5rem',
                            borderRadius: '50%',
                            background: 'rgba(164,83,155,0.25)',
                            border: '1px solid rgba(164,83,155,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 600, color: '#c47abd'
                        }}>
                            {step.id}
                        </div>
                        {/* Icon */}
                        <div style={{
                            flexShrink: 0,
                            width: '2rem', height: '2rem',
                            borderRadius: '0.5rem',
                            background: 'rgba(164,83,155,0.18)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#c47abd'
                        }}>
                            {step.icon}
                        </div>
                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>
                                {step.label}{' '}
                                <span style={{ fontWeight: 600, color: '#fff' }}>{step.highlight}</span>
                            </p>
                            <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>
                                {step.sublabel}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Arrow pointing down (alleen op iOS zichtbaar) */}
            <div style={{
                margin: '0 1.125rem 1rem',
                padding: '0.5rem 0.75rem',
                background: 'rgba(164,83,155,0.12)',
                border: '1px solid rgba(164,83,155,0.2)',
                borderRadius: '0.625rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
                <Share size={13} color="rgba(196,122,189,0.9)" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.73rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                    De <span style={{ color: '#c47abd', fontWeight: 600 }}>Deel-knop</span> staat in de Safari-werkbalk onderaan je scherm
                </p>
            </div>
        </>
    );
}
