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
        <div className="fixed inset-0 isolate z-9999 flex items-center justify-center p-4 sm:p-6">
            <div
                className="animate-in fade-in absolute inset-0 bg-slate-950/60 backdrop-blur-xl duration-300"
                onClick={onCancel}
            />

            <div
                className="animate-in fade-in zoom-in-95 slide-in-from-bottom-4 relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-[2.5rem] border border-(--border-color) bg-(--bg-card) shadow-(--shadow-card-elevated) ring-1 ring-white/10 duration-300 ease-out dark:border-white/10"
            >
                <div className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-theme-purple/20 blur-[80px]" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 size-48 rounded-full bg-theme-purple/10 blur-[80px]" />

                <div className="relative flex items-center justify-between px-8 pt-8 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-theme-purple/10 p-2.5 text-theme-purple">
                            <AlertCircle className="size-5" />
                        </div>
                        <h2 className="text-[10px] font-bold tracking-[0.2em] text-(--text-main)">
                            Naam Bevestigen
                        </h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="icon-button rounded-full p-2.5 text-(--text-muted) transition-all hover:text-(--text-main) active:scale-90"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="px-10 py-6 text-center">
                    <h3 className="mb-4 text-3xl font-bold tracking-tight text-(--text-main)">
                        Klopt je voornaam?
                    </h3>

                    <div className="mb-8 rounded-3xl border border-theme-purple/10 bg-theme-purple/5 p-6">
                        <p className="mb-2 text-sm font-medium tracking-wide text-(--text-muted) opacity-70">
                            Ingevulde voornaam:
                        </p>
                        <p className="text-2xl font-bold tracking-tight text-theme-purple">
                            {name}
                        </p>
                    </div>

                    <p className="mb-8 text-base leading-relaxed text-(--text-muted)">
                        Komt dit <span className="font-bold text-(--text-main) italic">exact</span> overeen met de naam op je paspoort of ID-kaart?
                        <br />
                        <span className="mt-2 inline-block text-xs opacity-80">
                            Een typefout kan leiden tot problemen bij de gate!
                        </span>
                    </p>

                    <div className="mb-2 flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            className="group form-button flex w-full items-center justify-center gap-3 rounded-2xl bg-theme-purple py-5 text-sm font-bold tracking-widest text-white shadow-lg shadow-theme-purple/20 transition-all hover:bg-theme-purple-dark"
                        >
                            <CheckCircle2 className="size-5 transition-transform group-hover:scale-110" />
                            Ja, dit klopt exact
                        </button>
                        <button
                            onClick={onCancel}
                            className="form-button w-full rounded-2xl border border-(--border-color) bg-(--bg-soft) py-5 text-sm font-bold tracking-widest text-(--text-muted) transition-all hover:bg-(--bg-card) hover:text-(--text-main) dark:border-white/5"
                        >
                            Nee, aanpassen
                        </button>
                    </div>
                </div>

                <div className="h-1.5 w-full bg-linear-to-r from-transparent via-theme-purple/30 to-transparent opacity-50" />
            </div>
        </div>,
        document.body
    );
}