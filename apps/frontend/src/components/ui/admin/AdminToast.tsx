'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    return (
        <AnimatePresence>
            {toast && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
                    className="fixed bottom-10 right-10 z-[9999]"
                >
                    <div className={`
                        px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-5 backdrop-blur-xl border border-white/10 relative overflow-hidden group
                        ${toast.type === 'success' ? 'bg-[var(--beheer-card-bg)]/90 border-l-[12px] border-l-emerald-500' : 
                          toast.type === 'error' ? 'bg-[var(--beheer-card-bg)]/90 border-l-[12px] border-l-red-500' :
                          toast.type === 'loading' ? 'bg-[var(--beheer-card-bg)]/90 border-l-[12px] border-l-amber-500' :
                          'bg-[var(--beheer-card-bg)]/90 border-l-[12px] border-l-[var(--beheer-accent)]'}
                    `}>
                        {/* Background Glow */}
                        <div className={`absolute -right-10 -top-10 h-32 w-32 blur-[60px] opacity-20 rounded-full transition-colors duration-500 pointer-events-none ${
                            toast.type === 'success' ? 'bg-emerald-500' : 
                            toast.type === 'error' ? 'bg-red-500' : 
                            toast.type === 'loading' ? 'bg-amber-500' :
                            'bg-[var(--beheer-accent)]'
                        }`} />

                        <div className={`
                            h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500
                            ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                              toast.type === 'error' ? 'bg-red-500/10 text-red-500' : 
                              toast.type === 'loading' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)]'}
                        `}>
                            {toast.type === 'success' && <CheckCircle2 className="h-6 w-6" />}
                            {toast.type === 'error' && <XCircle className="h-6 w-6" />}
                            {toast.type === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
                            {toast.type === 'info' && <AlertCircle className="h-6 w-6" />}
                        </div>

                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--beheer-text-muted)] mb-1 opacity-50">
                                {toast.type === 'success' ? 'Succes' : 
                                 toast.type === 'error' ? 'Foutmelding' : 
                                 toast.type === 'loading' ? 'Bezig...' : 'Informatie'}
                            </span>
                            <span className="font-extrabold text-[var(--beheer-text)] text-xs uppercase tracking-widest leading-tight">
                                {toast.message}
                            </span>
                        </div>

                        {onClose && (
                            <button 
                                onClick={onClose}
                                className="ml-4 p-2 rounded-xl text-[var(--beheer-text-muted)] hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <XCircle className="h-4 w-4 opacity-30 hover:opacity-100" />
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
