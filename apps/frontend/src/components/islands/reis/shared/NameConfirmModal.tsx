'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface NameConfirmModalProps {
    isOpen: boolean;
    name: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function NameConfirmModal({ isOpen, name, onConfirm, onCancel }: NameConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = 'unset'; };
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onCancel]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 isolate">
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={onCancel}
            />

            <div
                className="bg-[var(--bg-card)] w-full max-w-xl rounded-[2.5rem] shadow-[var(--shadow-card-elevated)] ring-1 ring-white/10 overflow-hidden flex flex-col relative z-10 border border-[var(--border-color)] dark:border-white/10 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out"
            >
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-theme-purple/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-theme-purple/10 rounded-full blur-[80px] pointer-events-none" />

                <div className="px-8 pt-8 pb-4 flex justify-between items-center relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-theme-purple/10 text-theme-purple p-2.5 rounded-2xl">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <h2 className="text-[10px] font-bold text-[var(--text-main)] tracking-[0.2em]">
                            Naam Bevestigen
                        </h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-2.5 rounded-full transition-all active:scale-90"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-10 py-6 text-center">
                    <h3 className="text-3xl font-bold text-[var(--text-main)] mb-4 tracking-tight">
                        Klopt je voornaam?
                    </h3>

                    <div className="p-6 rounded-3xl bg-theme-purple/5 border border-theme-purple/10 mb-8">
                        <p className="text-sm text-[var(--text-muted)] mb-2 font-medium tracking-wide opacity-70">
                            Ingevulde voornaam:
                        </p>
                        <p className="text-2xl font-bold text-theme-purple tracking-tight">
                            {name}
                        </p>
                    </div>

                    <p className="text-base text-[var(--text-muted)] mb-8 leading-relaxed">
                        Komt dit <span className="text-[var(--text-main)] font-bold italic">exact</span> overeen met de naam op je paspoort of ID-kaart?
                        <br />
                        <span className="text-xs mt-2 inline-block opacity-80">
                            Een typefout kan leiden tot problemen bij de gate!
                        </span>
                    </p>

                    <div className="flex flex-col gap-3 mb-2">
                        <button
                            onClick={onConfirm}
                            className="w-full py-5 bg-theme-purple hover:bg-theme-purple-dark text-white rounded-2xl font-bold text-sm tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-theme-purple/20 group"
                        >
                            <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Ja, dit klopt exact
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-full py-5 bg-[var(--bg-soft)] hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-2xl font-bold text-sm tracking-widest transition-all border border-[var(--border-color)] dark:border-white/5"
                        >
                            Nee, aanpassen
                        </button>
                    </div>
                </div>

                <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-theme-purple/30 to-transparent opacity-50" />
            </div>
        </div>,
        document.body
    );
}