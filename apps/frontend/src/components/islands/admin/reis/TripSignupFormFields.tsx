import React from 'react';
import { ChevronRight } from 'lucide-react';
import { DateInput } from '@/shared/ui/DateInput';

// --- Shared Types ---
export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
    label: string;
}

// --- Standard Fields ---

export function DateAndLabel({ label, defaultValue, name }: { label: string; defaultValue: string; name: string }) {
    const [val, setVal] = React.useState(defaultValue);
    return (
        <div className="space-y-1.5 group/field">
            <label className="block text-[11px] font-semibold text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1 opacity-70">{label}</label>
            <div className="relative">
                <DateInput 
                    name={name} 
                    value={val} 
                    onChange={(newVal) => setVal(newVal)}
                    autoComplete="off"
                    className="w-full px-4 py-2.5 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border border-[var(--beheer-border)]/40 rounded-xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all font-semibold outline-none shadow-inner"
                />
            </div>
        </div>
    );
}

export function Input({ label, ...props }: FieldProps) {
    return (
        <div className="space-y-1.5 group/field">
            <label className="block text-[11px] font-semibold text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1 opacity-70">{label}</label>
            <input 
                {...props} 
                className={`w-full px-4 py-2.5 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border border-[var(--beheer-border)]/40 rounded-xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all font-semibold outline-none shadow-inner placeholder:opacity-30 ${props.className || ''}`}
            />
        </div>
    );
}

export function Select({ label, children, ...props }: FieldProps & { children: React.ReactNode }) {
    return (
        <div className="space-y-1.5 group/field">
            <label className="block text-[11px] font-semibold text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1 opacity-70">{label}</label>
            <div className="relative group">
                <select 
                    {...props} 
                    className="w-full pl-4 pr-10 py-2.5 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border border-[var(--beheer-border)]/40 rounded-xl text-[var(--beheer-text)] font-semibold text-sm focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all appearance-none cursor-pointer outline-none shadow-inner"
                >
                    {children}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[var(--beheer-accent)] transition-colors text-[var(--beheer-text-muted)] opacity-50">
                    <ChevronRight className="h-4 w-4 rotate-90" />
                </div>
            </div>
        </div>
    );
}

export function Textarea({ label, ...props }: FieldProps) {
    return (
        <div className="space-y-1.5 group/field">
            <label className="block text-[11px] font-semibold text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1 opacity-70">{label}</label>
            <textarea 
                {...props} 
                className="w-full px-4 py-2.5 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border border-[var(--beheer-border)]/40 rounded-xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all resize-none min-h-[80px] font-semibold outline-none shadow-inner placeholder:opacity-30 leading-relaxed"
            />
        </div>
    );
}

export function Checkbox({ label, ...props }: FieldProps) {
    return (
        <label className="flex items-center gap-4 cursor-pointer group select-none">
            <div className="relative">
                <input type="checkbox" {...props} className="sr-only peer" />
                <div className="h-5 w-9 bg-[var(--beheer-border)]/20 dark:bg-white/5 backdrop-blur-md rounded-full peer-checked:bg-[var(--beheer-accent)] transition-all border border-[var(--beheer-border)]/30 group-hover:border-[var(--beheer-accent)]/50 shadow-inner" />
                <div className="absolute left-1 top-1 h-3 w-3 bg-white rounded-full transition-all peer-checked:left-5 shadow-lg transform peer-active:scale-90" />
            </div>
            <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] transition-colors tracking-tight">{label}</span>
            </div>
        </label>
    );
}

// --- Horizontal (Cockpit) Fields ---

export function HorizontalInput({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
    const id = React.useId();
    return (
        <div className="flex items-center gap-3 py-0.5 group">
            <label htmlFor={id} className="w-28 shrink-0 text-[10px] font-semibold text-[var(--beheer-text-muted)] opacity-50 group-hover:opacity-100 group-focus-within:text-[var(--beheer-accent)] group-focus-within:opacity-100 transition-all cursor-pointer">{label}</label>
            <div className="flex-1 bg-slate-500/5 dark:bg-black/40 rounded-lg px-3 border border-[var(--beheer-border)]/5 group-focus-within:border-[var(--beheer-accent)]/20 transition-all">
                <input 
                    {...props} 
                    id={id}
                    name={name}
                    className={`w-full bg-transparent text-xs text-[var(--beheer-text)] font-semibold outline-none placeholder:opacity-20 h-7 ${props.className || ''}`}
                />
            </div>
        </div>
    );
}

export function HorizontalDate({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
    const [val, setVal] = React.useState(defaultValue);
    const id = React.useId();
    return (
        <div className="flex items-center gap-3 py-0.5 group">
            <label htmlFor={id} className="w-28 shrink-0 text-[10px] font-semibold text-[var(--beheer-text-muted)] opacity-50 group-hover:opacity-100 group-focus-within:text-[var(--beheer-accent)] group-focus-within:opacity-100 transition-all cursor-pointer">{label}</label>
            <div className="flex-1 bg-slate-500/5 dark:bg-black/40 rounded-lg px-3 border border-[var(--beheer-border)]/5 group-focus-within:border-[var(--beheer-accent)]/20 transition-all">
                <DateInput 
                    id={id}
                    name={name} 
                    value={val} 
                    onChange={(nv) => setVal(nv)} 
                    className="bg-transparent text-xs text-[var(--beheer-text)] font-semibold outline-none h-7 w-full border-none p-0 focus:ring-0"
                />
            </div>
        </div>
    );
}

export function HorizontalSelect({ label, name, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; children: React.ReactNode }) {
    const id = React.useId();
    return (
        <div className="flex items-center gap-3 py-0.5 group relative">
            <label htmlFor={id} className="w-28 shrink-0 text-[10px] font-semibold text-[var(--beheer-text-muted)] opacity-50 group-hover:opacity-100 group-focus-within:text-[var(--beheer-accent)] group-focus-within:opacity-100 transition-all cursor-pointer">{label}</label>
            <div className="flex-1 bg-slate-500/5 dark:bg-black/40 rounded-lg px-3 border border-[var(--beheer-border)]/5 group-focus-within:border-[var(--beheer-accent)]/20 transition-all relative">
                <select 
                    {...props} 
                    id={id}
                    name={name}
                    className="w-full bg-transparent text-xs text-[var(--beheer-text)] font-semibold outline-none h-7 appearance-none cursor-pointer"
                >
                    {children}
                </select>
                <ChevronRight className="h-3 w-3 rotate-90 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--beheer-text-muted)] opacity-30 pointer-events-none" />
            </div>
        </div>
    );
}

export function HorizontalTextarea({ label, name, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string }) {
    const id = React.useId();
    return (
        <div className="flex flex-col gap-1 py-1 group">
            <label htmlFor={id} className="text-[10px] font-semibold text-[var(--beheer-text-muted)] opacity-50 group-hover:opacity-100 group-focus-within:text-[var(--beheer-accent)] group-focus-within:opacity-100 transition-all cursor-pointer">{label}</label>
            <textarea 
                {...props} 
                id={id}
                name={name}
                className="w-full bg-slate-500/5 dark:bg-black/40 rounded-xl p-2.5 text-xs text-[var(--beheer-text)] font-semibold outline-none placeholder:opacity-20 min-h-[45px] resize-none border border-[var(--beheer-border)]/5 transition-all focus:border-[var(--beheer-accent)]/30"
            />
        </div>
    );
}

export function HorizontalCheckbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
                <input type="checkbox" {...props} className="sr-only peer" />
                <div className="h-4 w-7 bg-[var(--beheer-text-muted)]/10 rounded-full peer-checked:bg-[var(--beheer-accent)] transition-all" />
                <div className="absolute left-0.5 top-0.5 h-3 w-3 bg-white rounded-full transition-all peer-checked:left-3.5 shadow-sm" />
            </div>
            <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] opacity-50 group-hover:opacity-100 transition-all">{label}</span>
        </label>
    );
}
