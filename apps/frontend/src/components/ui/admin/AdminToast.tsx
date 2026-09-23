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
            className="animate-in fade-in zoom-in-90 slide-in-from-bottom-6 sm:slide-in-from-bottom-12 pointer-events-auto fixed inset-x-4 z-100000 ml-auto max-w-md duration-300 ease-out sm:right-8 sm:left-auto md:right-10"
            style={{
                bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))'
            }}
        >
            <div className={`
                group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-white/10 px-4 py-3.5 shadow-2xl backdrop-blur-xl sm:gap-4.5 sm:rounded-3xl sm:px-6 sm:py-4.5
                ${toast.type === 'success' ? 'border-l-8px sm:border-l-10px border-l-(--theme-success) bg-bg-card/95' :
                    toast.type === 'error' ? 'border-l-8px sm:border-l-10px border-l-(--theme-error) bg-bg-card/95' :
                        toast.type === 'loading' ? 'border-l-8px sm:border-l-10px border-l-(--theme-warning) bg-bg-card/95' :
                            'border-l-8px sm:border-l-10px border-l-theme-purple bg-bg-card/95'}
            `}>
                <div className={`pointer-events-none absolute -top-10 -right-10 size-32 rounded-full opacity-20 blur-[60px] transition-colors duration-500 ${toast.type === 'success' ? 'bg-(--theme-success)' :
                    toast.type === 'error' ? 'bg-(--theme-error)' :
                        toast.type === 'loading' ? 'bg-(--theme-warning)' :
                            'bg-theme-purple'
                    }`} />

                <div className={`
                    flex size-10 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform duration-300 group-hover:scale-105 sm:size-12 sm:rounded-2xl
                    ${toast.type === 'success' ? 'bg-(--theme-success)/10 text-(--theme-success)' :
                        toast.type === 'error' ? 'bg-(--theme-error)/10 text-(--theme-error)' :
                            toast.type === 'loading' ? 'bg-(--theme-warning)/10 text-(--theme-warning)' :
                                'bg-theme-purple/10 text-theme-purple'}
                `}>
                    {toast.type === 'success' && <CheckCircle2 className="size-5 sm:size-6" />}
                    {toast.type === 'error' && <XCircle className="size-5 sm:size-6" />}
                    {toast.type === 'loading' && <Loader2 className="size-5 animate-spin sm:size-6" />}
                    {toast.type === 'info' && <AlertCircle className="size-5 sm:size-6" />}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="mb-0.5 text-[11px] font-semibold tracking-wider text-text-muted uppercase opacity-60 sm:text-xs">
                        {toast.type === 'success' ? 'Succes' :
                            toast.type === 'error' ? 'Foutmelding' :
                                toast.type === 'loading' ? 'Bezig...' : 'Informatie'}
                    </span>
                    <span className="wrap-break-words text-xs leading-snug font-bold tracking-wide text-text-main sm:text-sm">
                        {toast.message}
                    </span>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="shrink-0 cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/5 sm:rounded-xl sm:p-2"
                        aria-label="Sluiten"
                    >
                        <XCircle className="size-4 opacity-40 hover:opacity-100" />
                    </button>
                )}
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
