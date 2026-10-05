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
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onCancel]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 isolate z-9999 flex items-center justify-center p-4 sm:p-6">
            <div className="modal-backdrop" onClick={onCancel} />
            <div
                className="modal-content z-10 max-w-lg"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="icon-box">
                            <AlertCircle className="size-4" />
                        </div>
                        <h2 className="text-sm font-bold text-(--text-main)">
                            Naam Bevestigen
                        </h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="icon-button"
                        type="button"
                        aria-label="Sluiten"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="p-6 text-center">
                    <h3 className="mb-4 text-2xl font-bold tracking-tight text-(--text-main)">
                        Klopt je voornaam?
                    </h3>

                    <div className="mb-6 rounded-2xl border border-theme-purple/20 bg-theme-purple/10 p-4">
                        <p className="mb-1 text-xs font-semibold text-(--text-muted) uppercase">
                            Ingevulde voornaam:
                        </p>
                        <p className="text-2xl font-bold text-theme-purple">
                            {name}
                        </p>
                    </div>

                    <p className="mb-6 text-sm text-(--text-muted)">
                        Komt dit <span className="font-bold text-(--text-main) italic">exact</span> overeen met de naam op je paspoort of ID-kaart?
                        <br />
                        <span className="mt-2 inline-block text-xs opacity-80">
                            Een typefout kan leiden tot problemen bij de gate!
                        </span>
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            className="form-button w-full"
                            type="button"
                        >
                            <CheckCircle2 className="size-5" />
                            Ja, dit klopt exact
                        </button>
                        <button
                            onClick={onCancel}
                            className="btn-secondary w-full"
                            type="button"
                        >
                            Nee, aanpassen
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}