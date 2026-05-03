'use client';

import { ChevronDown, Check } from 'lucide-react';

export function Card({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-lg border border-[var(--beheer-border)] p-6">
            <div className="flex items-center gap-2 mb-4 text-[var(--beheer-text-muted)]">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
            </div>
            {children}
        </div>
    );
}

export function FilterField({ label, value, onChange, children }: { label: string, value: string, onChange: (v: string) => void, children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-tighter text-[var(--text-muted)] ml-1">{label}</label>
            <div className="relative group">
                <select 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-[var(--bg-main)] border-0 ring-1 ring-[var(--beheer-border)]/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] transition-all appearance-none cursor-pointer"
                >
                    {children}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)] pointer-events-none group-hover:text-[var(--beheer-accent)] transition-colors" />
            </div>
        </div>
    );
}

export function TypeTab({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                active 
                    ? 'bg-[var(--beheer-accent)] shadow-sm text-white' 
                    : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'
            }`}
        >
            {children}
        </button>
    );
}

export function TickItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
            <Check className="h-3 w-3 text-[var(--theme-purple)]" />
            {children}
        </li>
    );
}
