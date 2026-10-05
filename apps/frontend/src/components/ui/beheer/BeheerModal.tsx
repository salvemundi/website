'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface AdminModalProps {
    title: string;
    subtitle?: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

export default function BeheerModal({
    title,
    subtitle,
    isOpen,
    onClose,
    children,
    maxWidth = '2xl'
}: AdminModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    const maxWidthClasses = new Map([
        ['sm', 'max-w-sm'],
        ['md', 'max-w-md'],
        ['lg', 'max-w-lg'],
        ['xl', 'max-w-xl'],
        ['2xl', 'max-w-2xl'],
        ['3xl', 'max-w-3xl'],
        ['4xl', 'max-w-4xl'],
        ['5xl', 'max-w-5xl'],
        ['6xl', 'max-w-6xl'],
        ['7xl', 'max-w-7xl'],
    ]);

    const modalContent = (
        <div
            className="modal-backdrop"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`modal-content ${maxWidthClasses.get(maxWidth) ?? 'max-w-2xl'}`}
                onClick={(event) => event.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    <div className="min-w-0 space-y-0.5 pr-4">
                        <h2 className="text-lg section-title sm:text-xl">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="line-clamp-1 text-xs font-medium text-(--text-muted)">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Sluiten"
                        className="icon-button size-9 p-2"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative z-10 custom-scrollbar flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

