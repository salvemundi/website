'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface AdminToastProps {
    toast: Toast | null;
    onClose?: () => void;
}

export default function AdminToast({ toast, onClose }: AdminToastProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!toast || !mounted) return null;

    const content = (
        <div
            className="fixed left-4 right-4 sm:left-auto sm:right-8 md:right-10 z-100000 animate-in fade-in zoom-in-90 slide-in-from-bottom-6 sm:slide-in-from-bottom-12 duration-300 ease-out pointer-events-auto max-w-md ml-auto"
            style={{
                bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))'
            }}
        >
            <div className={`
                px-4 py-3.5 sm:px-6 sm:py-4.5 rounded-2xl sm:rounded-3xl shadow-2xl flex items-center gap-3.5 sm:gap-4.5 backdrop-blur-xl border border-white/10 relative overflow-hidden group
                ${toast.type === 'success' ? 'bg-bg-card/95 border-l-8px sm:border-l-10px border-l-(--theme-success)' :
                    toast.type === 'error' ? 'bg-bg-card/95 border-l-8px sm:border-l-10px border-l-(--theme-error)' :
                        toast.type === 'loading' ? 'bg-bg-card/95 border-l-8px sm:border-l-10px border-l-(--theme-warning)' :
                            'bg-bg-card/95 border-l-8px sm:border-l-10px border-l-theme-purple'}
            `}>
                <div className={`absolute -right-10 -top-10 h-32 w-32 blur-[60px] opacity-20 rounded-full transition-colors duration-500 pointer-events-none ${toast.type === 'success' ? 'bg-(--theme-success)' :
                    toast.type === 'error' ? 'bg-(--theme-error)' :
                        toast.type === 'loading' ? 'bg-(--theme-warning)' :
                            'bg-theme-purple'
                    }`} />

                <div className={`
                    h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105 duration-300
                    ${toast.type === 'success' ? 'bg-(--theme-success)/10 text-(--theme-success)' :
                        toast.type === 'error' ? 'bg-(--theme-error)/10 text-(--theme-error)' :
                            toast.type === 'loading' ? 'bg-(--theme-warning)/10 text-(--theme-warning)' :
                                'bg-theme-purple/10 text-theme-purple'}
                `}>
                    {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />}
                    {toast.type === 'error' && <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
                    {toast.type === 'loading' && <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />}
                    {toast.type === 'info' && <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-text-muted mb-0.5 opacity-60 uppercase">
                        {toast.type === 'success' ? 'Succes' :
                            toast.type === 'error' ? 'Foutmelding' :
                                toast.type === 'loading' ? 'Bezig...' : 'Informatie'}
                    </span>
                    <span className="font-bold text-text-main text-xs sm:text-sm tracking-wide leading-snug wrap-break-words">
                        {toast.message}
                    </span>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-text-muted hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                        aria-label="Sluiten"
                    >
                        <XCircle className="h-4 w-4 opacity-40 hover:opacity-100" />
                    </button>
                )}
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
