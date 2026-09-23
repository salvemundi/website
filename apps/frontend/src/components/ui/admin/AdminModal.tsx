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

export default function AdminModal({
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
            className="animate-in fade-in fixed inset-0 z-250 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md duration-300 sm:p-6"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`w-full bg-bg-card/95 backdrop-blur-xl ${maxWidthClasses.get(maxWidth) ?? 'max-w-2xl'} animate-in zoom-in-95 my-auto flex max-h-[min(90vh,820px)] flex-col overflow-hidden rounded-2xl border border-border-color/60 shadow-[0_40px_100px_rgba(0,0,0,0.5)] duration-300 sm:rounded-3xl`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-border-color px-6 py-5">
                    <div className="min-w-0 space-y-0.5 pr-4">
                        <h2 className="truncate text-lg font-bold tracking-tight text-purple-700 sm:text-xl dark:text-purple-300">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="line-clamp-1 text-xs font-medium text-text-muted">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Sluiten"
                        className="icon-button flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-bg-soft text-text-muted transition-all hover:bg-bg-soft/80 hover:text-text-main active:scale-95"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="custom-scrollbar relative z-10 flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

