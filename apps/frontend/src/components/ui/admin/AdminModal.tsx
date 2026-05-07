'use client';

import React, { useEffect } from 'react';
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

    if (!isOpen) return null;

    const maxWidthClasses = {
        'sm': 'max-w-sm',
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
            <div 
                className={`bg-[var(--beheer-card-bg)]/90 backdrop-blur-xl w-full ${maxWidthClasses[maxWidth]} squircle-lg shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-[var(--beheer-border)]/50 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 border-b border-[var(--beheer-border)] flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-[var(--beheer-text)] tracking-tight">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-xs font-semibold text-[var(--beheer-text-muted)] tracking-widest uppercase opacity-60">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-4 bg-[var(--beheer-card-soft)] hover:bg-[var(--beheer-card-soft)]/80 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] transition-all squircle active:scale-90 group"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
                    {children}
                </div>
            </div>
            
            {/* Click outside to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
