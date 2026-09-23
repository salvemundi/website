'use client';

import { Check } from 'lucide-react';

export function Card({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="rounded-3xl border border-(--beheer-border) bg-(--beheer-card-bg) p-8 shadow-lg">
            <div className="mb-6 flex items-center gap-3 text-(--beheer-accent)">
                <div className="rounded-xl bg-(--beheer-accent)/10 p-2">
                    {icon}
                </div>
                <span className="text-[10px] font-semibold tracking-widest text-(--beheer-text-muted) uppercase">{title}</span>
            </div>
            {children}
        </div>
    );
}

import AdminSelect from '@/components/ui/admin/AdminSelect';

export function FilterField({ label, value, onChange, options }: { label: string, value: string, onChange: (fieldValue: string) => void, options: { value: string; label: string }[] }) {
    return (
        <div className="space-y-2">
            <label className="ml-1 text-[10px] font-semibold tracking-widest text-(--beheer-text-muted) uppercase opacity-60">{label}</label>
            <AdminSelect 
                value={value}
                onChange={onChange}
                options={options}
                size="sm"
            />
        </div>
    );
}

export function TypeTab({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
    return (
        <button 
            onClick={onClick}
            className={`tab-button rounded-xl px-5 py-2.5 text-[10px] font-semibold tracking-widest uppercase transition-all active:scale-95 ${
                active 
                    ? 'bg-(--beheer-accent) text-white shadow-lg' 
                    : 'text-(--beheer-text-muted) hover:bg-(--beheer-card-bg) hover:text-(--beheer-text)'
            }`}
        >
            {children}
        </button>
    );
}

export function TickItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-center gap-3 py-1 text-xs font-semibold text-(--beheer-text-muted)">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                <Check className="size-3 text-green-500" />
            </div>
            {children}
        </li>
    );
}
