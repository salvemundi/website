'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={handleBackdropClick}
        >
            <div className="bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-theme-purple/10">
                    <h2 className="text-2xl font-bold text-theme">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-theme-purple/10 transition-colors"
                        aria-label="Sluiten"
                    >
                        <X className="h-6 w-6 text-theme-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    <div className="text-theme leading-relaxed whitespace-pre-wrap">
                        {children}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-theme-purple/10 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-full bg-theme-purple/10 text-theme-purple font-semibold hover:bg-theme-purple/20 transition-colors"
                    >
                        Sluiten
                    </button>
                </div>
            </div>
        </div>
    );
}
