import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

export const inputClass = 'w-full px-5 py-4 rounded-xl bg-(--bg-main)/40 dark:bg-black/20 backdrop-blur-sm border-0 ring-1 ring-(--beheer-border)/40 text-(--beheer-text) text-sm font-semibold focus:ring-2 focus:ring-(--beheer-accent) focus:bg-(--bg-main)/80 outline-none transition-all shadow-inner placeholder:text-(--beheer-text-muted)/40';

export function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`group/field space-y-2 ${className}`}>
            <label className="px-1 text-xs font-semibold tracking-tight text-(--beheer-text-muted) transition-colors group-focus-within/field:text-(--beheer-accent)">{label}</label>
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
    const variants = new Map<string, string>([
        ['primary', 'bg-(--beheer-accent) text-white shadow-(--shadow-glow) hover:opacity-90'],
        ['secondary', 'bg-(--beheer-card-bg) border border-(--beheer-border) text-(--beheer-text) hover:border-(--beheer-accent)/50'],
        ['danger', 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'],
        ['success', 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'],
        ['ghost', 'text-(--beheer-text-muted) hover:text-(--beheer-text) hover:bg-(--beheer-card-soft)']
    ]);

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`beheer-button flex items-center justify-center gap-2 rounded-(--beheer-radius) px-6 py-3 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${variants.get(variant) || ''} ${className}`}
        >
            {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4" />}
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
    const variants = new Map<string, string>([
        ['accent', 'text-(--beheer-accent) bg-(--beheer-accent)/5 border-(--beheer-accent)/10 hover:bg-(--beheer-accent)/10 hover:border-(--beheer-accent)/20'],
        ['danger', 'text-red-500 bg-red-500/5 border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20'],
        ['muted', 'text-(--beheer-text-muted) bg-(--beheer-text-muted)/5 border-(--beheer-text-muted)/10 hover:bg-(--beheer-text-muted)/10 hover:border-(--beheer-text-muted)/20']
    ]);

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            title={title}
            className={`icon-button rounded-xl border p-2.5 transition-all active:scale-90 disabled:opacity-50 ${variants.get(variant) || ''}`}
        >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
        </button>
    );
}

export function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
    return (
        <div className="py-24 text-center text-(--beheer-text-muted)">
            <div className="mx-auto mb-8 w-fit rounded-full bg-(--beheer-card-soft)/50 p-8 shadow-inner ring-1 ring-(--beheer-border)/20">
                <Icon className="size-12 text-(--beheer-accent) opacity-20" />
            </div>
            <p className="text-sm font-semibold opacity-60">{text}</p>
        </div>
    );
}

