'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, X, Smartphone, Share, Plus } from 'lucide-react';

const DISMISSED_KEY = 'pwa_install_dismissed_until';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Mode = 'native' | 'ios';

function detectIos(): boolean {
    const ua = navigator.userAgent;
    // iPadOS 13+ rapporteert als Mac, maar heeft touchPoints
    const isIpadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return /iphone|ipad|ipod/i.test(ua) || isIpadOs;
}

function detectIosSafari(): boolean {
    const ua = navigator.userAgent;
    // Safari op iOS heeft geen 'Chrome' of 'CriOS' of 'FxiOS' in de UA
    const isIos = detectIos();
    const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|EdgiOS/i.test(ua);
    return isIos && isSafari;
}

function isDismissed(): boolean {
    try {
        const val = localStorage.getItem(DISMISSED_KEY);
        return !!val && Date.now() < parseInt(val, 10);
    } catch {
        return false;
    }
}

function isStandalone(): boolean {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
    return false;
}

// ─── iOS Share Icon (SVG replica van het SF Symbol dat Safari gebruikt) ──────
function IosShareIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v12M8 6l4-4 4 4" />
            <path d="M4 14v6a1 1 0 001 1h14a1 1 0 001-1v-6" />
        </svg>
    );
}

// ─── Toast wrapper met slide-up animatie ─────────────────────────────────────
function ToastWrapper({ children, visible }: { children: React.ReactNode; visible: boolean }) {
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
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.3s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                // Start net onder beeld, glijd omhoog
                animation: visible ? 'pwaToastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
            }}
        >
            <style>{`
                @keyframes pwaToastIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(1.5rem) scale(0.97); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
            `}</style>
            <div style={{
                background: 'linear-gradient(145deg, rgba(75,36,72,0.97) 0%, rgba(58,27,56,0.98) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(164,83,155,0.3)',
                borderRadius: '1.375rem',
                boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(164,83,155,0.08), inset 0 1px 0 rgba(255,255,255,0.07)',
                overflow: 'hidden',
            }}>
                {children}
            </div>
        </div>
    );
}

// ─── Gedeelde header rij ──────────────────────────────────────────────────────
function ToastHeader({ onDismiss }: { onDismiss: () => void }) {
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
                boxShadow: '0 4px 14px rgba(164,83,155,0.45)',
            }}>
                <Smartphone size={20} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#fff', lineHeight: 1.3 }}>
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
                    fontFamily: 'inherit',
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

// ─── Native Chrome/Edge variant ───────────────────────────────────────────────
function NativeToast({ onInstall, onDismiss, installing }: {
    onInstall: () => void;
    onDismiss: () => void;
    installing: boolean;
}) {
    return (
        <>
            <ToastHeader onDismiss={onDismiss} />
            <div style={{
                padding: '0 1.125rem 1rem',
                display: 'flex', gap: '0.625rem',
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
                        fontWeight: 700,
                        cursor: installing ? 'default' : 'pointer',
                        boxShadow: installing ? 'none' : '0 3px 10px rgba(164,83,155,0.4)',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit',
                    }}
                >
                    <Download size={15} />
                    {installing ? 'Bezig…' : 'Voeg toe aan beginscherm'}
                </button>
            </div>
        </>
    );
}

// ─── iOS Safari instructie variant ───────────────────────────────────────────
const IOS_STEPS = [
    {
        id: 1,
        icon: <IosShareIcon />,
        label: 'Tik op',
        highlight: 'Deel',
        sublabel: 'de knop onderaan in Safari',
    },
    {
        id: 2,
        icon: <Plus size={18} />,
        label: 'Kies',
        highlight: 'Zet op beginscherm',
        sublabel: 'scroll omlaag in het menu',
    },
    {
        id: 3,
        icon: <Smartphone size={18} />,
        label: 'Tik op',
        highlight: 'Voeg toe',
        sublabel: 'rechts bovenin',
    },
];

function IosToast({ onDismiss }: { onDismiss: () => void }) {
    return (
        <>
            <ToastHeader onDismiss={onDismiss} />

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 1.125rem' }} />

            {/* Steps */}
            <div style={{ padding: '0.875rem 1.125rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <p style={{ margin: '0 0 0.375rem', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                    Hoe installeer je de app?
                </p>
                {IOS_STEPS.map((step, i) => (
                    <div
                        key={step.id}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '0.75rem',
                            padding: '0.625rem 0.875rem',
                            animation: `pwaStepIn 0.35s ${0.08 * i}s cubic-bezier(0.34,1.56,0.64,1) both`,
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
                            fontSize: '0.7rem', fontWeight: 700, color: '#c47abd',
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
                            color: '#c47abd',
                        }}>
                            {step.icon}
                        </div>
                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>
                                {step.label}{' '}
                                <span style={{ fontWeight: 700, color: '#fff' }}>{step.highlight}</span>
                            </p>
                            <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>
                                {step.sublabel}
                            </p>
                        </div>
                    </div>
                ))}
                <style>{`
                    @keyframes pwaStepIn {
                        from { opacity: 0; transform: translateX(-8px); }
                        to   { opacity: 1; transform: translateX(0); }
                    }
                `}</style>
            </div>

            {/* Arrow pointing down (alleen op iOS zichtbaar) */}
            <div style={{
                margin: '0 1.125rem 1rem',
                padding: '0.5rem 0.75rem',
                background: 'rgba(164,83,155,0.12)',
                border: '1px solid rgba(164,83,155,0.2)',
                borderRadius: '0.625rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
                <Share size={13} color="rgba(196,122,189,0.9)" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.73rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                    De <span style={{ color: '#c47abd', fontWeight: 600 }}>Deel-knop</span> staat in de Safari-werkbalk onderaan je scherm
                </p>
            </div>
        </>
    );
}

// ─── Hoofd export ─────────────────────────────────────────────────────────────
export function PwaInstallToast() {
    const [show, setShow] = useState(false);
    const [mode, setMode] = useState<Mode>('native');
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        if (isStandalone()) return;
        if (isDismissed()) return;
        // Alleen op touch-apparaten (telefoon/tablet) — niet op desktop/laptop
        if (!window.matchMedia('(pointer: coarse)').matches) return;

        if (detectIosSafari()) {
            // iOS Safari: toon altijd de instructie-flow (geen native prompt beschikbaar)
            setMode('ios');
            setTimeout(() => setShow(true), 2500);
            return;
        }

        // Chrome/Edge/Android: wacht op beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setMode('native');
            setTimeout(() => setShow(true), 2500);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        setInstalling(true);
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShow(false);
        } else {
            setInstalling(false);
        }
        setDeferredPrompt(null);
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setShow(false);
        try {
            localStorage.setItem(DISMISSED_KEY, String(Date.now() + DISMISS_DURATION_MS));
        } catch { /* noop */ }
    }, []);

    if (!show) return null;

    return (
        <ToastWrapper visible={show}>
            {mode === 'ios' ? (
                <IosToast onDismiss={handleDismiss} />
            ) : (
                <NativeToast onInstall={handleInstall} onDismiss={handleDismiss} installing={installing} />
            )}
        </ToastWrapper>
    );
}
