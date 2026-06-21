'use client';

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
    if (!toast) return null;

    return (
        <div
            className="fixed bottom-10 right-10 z-[100000] animate-in fade-in zoom-in-90 slide-in-from-bottom-12 slide-in-from-right-5 duration-300 ease-out"
        >
            <div className={`
                px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-5 backdrop-blur-xl border border-white/10 relative overflow-hidden group
                ${toast.type === 'success' ? 'bg-bg-card/90 border-l-[12px] border-l-(--theme-success)' :
                    toast.type === 'error' ? 'bg-bg-card/90 border-l-[12px] border-l-(--theme-error)' :
                        toast.type === 'loading' ? 'bg-bg-card/90 border-l-[12px] border-l-(--theme-warning)' :
                            'bg-bg-card/90 border-l-[12px] border-l-theme-purple'}
            `}>
                <div className={`absolute -right-10 -top-10 h-32 w-32 blur-[60px] opacity-20 rounded-full transition-colors duration-500 pointer-events-none ${toast.type === 'success' ? 'bg-(--theme-success)' :
                    toast.type === 'error' ? 'bg-(--theme-error)' :
                        toast.type === 'loading' ? 'bg-(--theme-warning)' :
                            'bg-theme-purple'
                    }`} />

                <div className={`
                    h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500
                    ${toast.type === 'success' ? 'bg-(--theme-success)/10 text-(--theme-success)' :
                        toast.type === 'error' ? 'bg-(--theme-error)/10 text-(--theme-error)' :
                            toast.type === 'loading' ? 'bg-(--theme-warning)/10 text-(--theme-warning)' :
                                'bg-theme-purple/10 text-theme-purple'}
                `}>
                    {toast.type === 'success' && <CheckCircle2 className="h-6 w-6" />}
                    {toast.type === 'error' && <XCircle className="h-6 w-6" />}
                    {toast.type === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
                    {toast.type === 'info' && <AlertCircle className="h-6 w-6" />}
                </div>

                <div className="flex flex-col min-w-0">
                    <span className="text-base font-semibold tracking-wider text-text-muted mb-1 opacity-50">
                        {toast.type === 'success' ? 'Succes' :
                            toast.type === 'error' ? 'Foutmelding' :
                                toast.type === 'loading' ? 'Bezig...' : 'Informatie'}
                    </span>
                    <span className="font-extrabold text-text-main text-base tracking-widest leading-tight">
                        {toast.message}
                    </span>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-4 p-2 rounded-xl text-text-muted hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <XCircle className="h-4 w-4 opacity-30 hover:opacity-100" />
                    </button>
                )}
            </div>
        </div>
    );
}