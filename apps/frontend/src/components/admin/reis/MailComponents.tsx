'use client';

import { ChevronDown, Check } from 'lucide-react';

export function Card({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-3xl shadow-lg border border-[var(--beheer-border)] p-8">
            <div className="flex items-center gap-3 mb-6 text-[var(--beheer-accent)]">
                <div className="p-2 bg-[var(--beheer-accent)]/10 rounded-xl">
                    {icon}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)]">{title}</span>
            </div>
            {children}
        </div>
    );
}

export function FilterField({ label, value, onChange, children }: { label: string, value: string, onChange: (v: string) => void, children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)] ml-1 opacity-60">{label}</label>
            <div className="relative group">
                <select 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-4 pr-10 py-3.5 bg-[var(--bg-main)]/50 border border-[var(--beheer-border)]/50 rounded-2xl text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)] transition-all appearance-none cursor-pointer shadow-inner"
                >
                    {children}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)] pointer-events-none group-hover:text-[var(--beheer-accent)] transition-colors opacity-50" />
            </div>
        </div>
    );
}

export function TypeTab({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
    return (
        <button 
            onClick={onClick}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all active:scale-95 ${
                active 
                    ? 'bg-[var(--beheer-accent)] shadow-lg text-white' 
                    : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-bg)]'
            }`}
        >
            {children}
        </button>
    );
}

export function TickItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-center gap-3 text-xs font-semibold text-[var(--beheer-text-muted)] py-1">
            <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-green-500" />
            </div>
            {children}
        </li>
    );
}
