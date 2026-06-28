'use client';

import { Check } from 'lucide-react';

export function Card({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-(--beheer-card-bg) rounded-3xl shadow-lg border border-(--beheer-border) p-8">
            <div className="flex items-center gap-3 mb-6 text-(--beheer-accent)">
                <div className="p-2 bg-(--beheer-accent)/10 rounded-xl">
                    {icon}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-(--beheer-text-muted)">{title}</span>
            </div>
            {children}
        </div>
    );
}

export function FilterField({ label, value, onChange, children }: { label: string, value: string, onChange: (fieldValue: string) => void, children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-(--beheer-text-muted) ml-1 opacity-60">{label}</label>
            <select 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="beheer-select text-xs font-semibold"
            >
                {children}
            </select>
        </div>
    );
}

export function TypeTab({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
    return (
        <button 
            onClick={onClick}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all active:scale-95 ${
                active 
                    ? 'bg-(--beheer-accent) shadow-lg text-white' 
                    : 'text-(--beheer-text-muted) hover:text-(--beheer-text) hover:bg-(--beheer-card-bg)'
            }`}
        >
            {children}
        </button>
    );
}

export function TickItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-center gap-3 text-xs font-semibold text-(--beheer-text-muted) py-1">
            <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-green-500" />
            </div>
            {children}
        </li>
    );
}
