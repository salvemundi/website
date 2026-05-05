import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

export const inputClass = 'w-full px-5 py-4 rounded-xl bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border-0 ring-1 ring-[var(--beheer-border)]/40 text-[var(--beheer-text)] text-sm font-semibold focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 outline-none transition-all shadow-inner placeholder:text-[var(--beheer-text-muted)]/40';

export function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`space-y-2 group/field ${className}`}>
            <label className="text-xs font-semibold tracking-tight text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1">{label}</label>
            <div className="relative">
                {children}
            </div>
        </div>
    );
}

export function Button({ 
    children, 
    onClick, 
    variant = 'primary', 
    icon: Icon, 
    loading = false, 
    disabled = false, 
    className = '' 
}: { 
    children: React.ReactNode; 
    onClick?: (e: React.MouseEvent) => void; 
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'; 
    icon?: LucideIcon; 
    loading?: boolean; 
    disabled?: boolean;
    className?: string;
}) {
    const variants = {
        primary: 'bg-[var(--beheer-accent)] text-white shadow-[var(--shadow-glow)] hover:opacity-90',
        secondary: 'bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:border-[var(--beheer-accent)]/50',
        danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
        success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20',
        ghost: 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)]'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-[var(--beheer-radius)] text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${variants[variant]} ${className}`}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
            {children}
        </button>
    );
}

export function ActionButton({ 
    icon: Icon, 
    onClick, 
    variant = 'accent', 
    disabled = false, 
    loading = false,
    title 
}: { 
    icon: LucideIcon; 
    onClick: (e: React.MouseEvent) => void; 
    variant?: 'accent' | 'danger' | 'muted'; 
    disabled?: boolean;
    loading?: boolean;
    title?: string;
}) {
    const variants = {
        accent: 'text-[var(--beheer-accent)] bg-[var(--beheer-accent)]/5 border-[var(--beheer-accent)]/10 hover:bg-[var(--beheer-accent)]/10 hover:border-[var(--beheer-accent)]/20',
        danger: 'text-red-500 bg-red-500/5 border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20',
        muted: 'text-[var(--beheer-text-muted)] bg-[var(--beheer-text-muted)]/5 border-[var(--beheer-text-muted)]/10 hover:bg-[var(--beheer-text-muted)]/10 hover:border-[var(--beheer-text-muted)]/20'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            title={title}
            className={`p-2.5 rounded-xl border transition-all active:scale-90 disabled:opacity-50 ${variants[variant]}`}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        </button>
    );
}

export function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
    return (
        <div className="py-24 text-center text-[var(--beheer-text-muted)] animate-in fade-in zoom-in-95 duration-500">
            <div className="p-8 bg-[var(--beheer-card-soft)]/50 rounded-full w-fit mx-auto mb-8 ring-1 ring-[var(--beheer-border)]/20 shadow-inner">
                <Icon className="h-12 w-12 opacity-20 text-[var(--beheer-accent)]" />
            </div>
            <p className="font-semibold text-sm opacity-60">{text}</p>
        </div>
    );
}

