import React from 'react';
import { DateInput } from '@/shared/ui/DateInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import AdminSelect, { AdminSelectOption } from '@/components/ui/admin/AdminSelect';

const parseOptionsFromChildren = (children: React.ReactNode): AdminSelectOption[] => {
    const list = React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === 'option') {
            const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
            return {
                value: (props.value ?? '') as string | number,
                label: (props.children as string) || ''
            };
        }
        return null;
    });
    return (list || []).filter(Boolean) as AdminSelectOption[];
};

// --- Shared Types ---
export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
    label: string;
}

// --- Standard Fields ---

export function DateAndLabel({ label, defaultValue, name }: { label: string; defaultValue: string; name: string }) {
    const [val, setVal] = React.useState(defaultValue);
    return (
        <div className="space-y-1.5 group/field">
            <label className="block text-[11px] font-semibold text-(--beheer-text-muted) group-focus-within/field:text-(--beheer-accent) transition-colors px-1 opacity-70">{label}</label>
            <div className="relative">
                <DateInput 
                    name={name} 
                    value={val} 
                    onChange={(newVal) => setVal(newVal)}
                    autoComplete="off"
                    className="w-full px-4 py-2.5 bg-(--bg-main)/40 dark:bg-black/20 backdrop-blur-sm border border-(--beheer-border)/40 rounded-xl text-sm text-(--beheer-text) focus:ring-2 focus:ring-(--beheer-accent) focus:bg-(--bg-main)/80 transition-all font-semibold outline-none shadow-inner"
                />
            </div>
        </div>
    );
}

export function PhoneAndLabel({ label, defaultValue, name }: { label: string; defaultValue: string; name: string }) {
    const [val, setVal] = React.useState(defaultValue);
    return (
        <div className="space-y-1.5 group/field">
            <label className="block text-[11px] font-semibold text-(--beheer-text-muted) group-focus-within/field:text-(--beheer-accent) transition-colors px-1 opacity-70">{label}</label>
            <div className="relative">
                <PhoneInput 
                    name={name} 
                    value={val} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(e.target.value)}
                    autoComplete="off"
                    className="w-full px-4 py-2.5 bg-(--bg-main)/40 dark:bg-black/20 backdrop-blur-sm border border-(--beheer-border)/40 rounded-xl text-sm text-(--beheer-text) focus:ring-2 focus:ring-(--beheer-accent) focus:bg-(--bg-main)/80 transition-all font-semibold outline-none shadow-inner"
                />
            </div>
        </div>
    );
}

export function Input({ label, ...props }: FieldProps) {
    return (
        <div className="space-y-1.5 group/field">
            <label className="block text-[11px] font-semibold text-(--beheer-text-muted) group-focus-within/field:text-(--beheer-accent) transition-colors px-1 opacity-70">{label}</label>
            <input 
                {...props} 
                className={`w-full px-4 py-2.5 bg-(--bg-main)/40 dark:bg-black/20 backdrop-blur-sm border border-(--beheer-border)/40 rounded-xl text-sm text-(--beheer-text) focus:ring-2 focus:ring-(--beheer-accent) focus:bg-(--bg-main)/80 transition-all font-semibold outline-none shadow-inner placeholder:opacity-30 ${props.className || ''}`}
            />
        </div>
    );
}

export function Select({ label, children, ...props }: FieldProps & { children: React.ReactNode }) {
    const options = parseOptionsFromChildren(children);

    const handleSelectChange = (val: string | number) => {
        if (props.onChange) {
            const event = {
                target: {
                    name: props.name,
                    id: props.id,
                    value: val
                },
                currentTarget: {
                    name: props.name,
                    id: props.id,
                    value: val
                }
            } as React.ChangeEvent<HTMLSelectElement>;
            props.onChange(event);
        }
    };

    return (
        <div className="space-y-1.5 group/field">
            <label className="block text-[11px] font-semibold text-(--beheer-text-muted) transition-colors px-1 opacity-70">
                {label}
            </label>
            <AdminSelect
                name={props.name}
                defaultValue={props.defaultValue as string | number}
                value={props.value as string | number}
                onChange={handleSelectChange}
                options={options}
                disabled={props.disabled}
            />
        </div>
    );
}

export function Textarea({ label, ...props }: FieldProps) {
    return (
        <div className="space-y-1.5 group/field">
            <label className="block text-[11px] font-semibold text-(--beheer-text-muted) group-focus-within/field:text-(--beheer-accent) transition-colors px-1 opacity-70">{label}</label>
            <textarea 
                {...props} 
                className="w-full px-4 py-2.5 bg-(--bg-main)/40 dark:bg-black/20 backdrop-blur-sm border border-(--beheer-border)/40 rounded-xl text-sm text-(--beheer-text) focus:ring-2 focus:ring-(--beheer-accent) focus:bg-(--bg-main)/80 transition-all resize-none min-h-[80px] font-semibold outline-none shadow-inner placeholder:opacity-30 leading-relaxed"
            />
        </div>
    );
}

export function Checkbox({ label, ...props }: FieldProps) {
    return (
        <label className="flex items-center gap-4 cursor-pointer group select-none">
            <div className="relative">
                <input type="checkbox" {...props} className="sr-only peer" />
                <div className="h-5 w-9 bg-(--beheer-border)/20 dark:bg-white/5 backdrop-blur-md rounded-full peer-checked:bg-(--beheer-accent) transition-all border border-(--beheer-border)/30 group-hover:border-(--beheer-accent)/50 shadow-inner" />
                <div className="absolute left-1 top-1 h-3 w-3 bg-white rounded-full transition-all peer-checked:left-5 shadow-lg transform peer-active:scale-90" />
            </div>
            <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-(--beheer-text-muted) group-hover:text-(--beheer-text) transition-colors tracking-tight">{label}</span>
            </div>
        </label>
    );
}

// --- Horizontal (Cockpit) Fields ---

export function HorizontalInput({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
    const id = React.useId();
    return (
        <div className="flex items-center gap-3 py-0.5 group">
            <label htmlFor={id} className="w-28 shrink-0 text-[10px] font-semibold text-(--beheer-text-muted) opacity-50 group-hover:opacity-100 group-focus-within:text-(--beheer-accent) group-focus-within:opacity-100 transition-all cursor-pointer">{label}</label>
            <div className="flex-1 bg-slate-500/5 dark:bg-black/40 rounded-lg px-3 border border-(--beheer-border)/5 group-focus-within:border-(--beheer-accent)/20 transition-all">
                <input 
                    {...props} 
                    id={id}
                    name={name}
                    className={`w-full bg-transparent text-xs text-(--beheer-text) font-semibold outline-none placeholder:opacity-20 h-7 ${props.className || ''}`}
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
            <label htmlFor={id} className="w-28 shrink-0 text-[10px] font-semibold text-(--beheer-text-muted) opacity-50 group-hover:opacity-100 group-focus-within:text-(--beheer-accent) group-focus-within:opacity-100 transition-all cursor-pointer">{label}</label>
            <div className="flex-1 bg-slate-500/5 dark:bg-black/40 rounded-lg px-3 border border-(--beheer-border)/5 group-focus-within:border-(--beheer-accent)/20 transition-all">
                <DateInput 
                    id={id}
                    name={name} 
                    value={val} 
                    onChange={(nv) => setVal(nv)} 
                    className="bg-transparent text-xs text-(--beheer-text) font-semibold outline-none h-7 w-full border-none p-0 focus:ring-0"
                />
            </div>
        </div>
    );
}

export function HorizontalPhone({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
    const [val, setVal] = React.useState(defaultValue);
    const id = React.useId();
    return (
        <div className="flex items-center gap-3 py-0.5 group">
            <label htmlFor={id} className="w-28 shrink-0 text-[10px] font-semibold text-(--beheer-text-muted) opacity-50 group-hover:opacity-100 group-focus-within:text-(--beheer-accent) group-focus-within:opacity-100 transition-all cursor-pointer">{label}</label>
            <div className="flex-1 bg-slate-500/5 dark:bg-black/40 rounded-lg px-3 border border-(--beheer-border)/5 group-focus-within:border-(--beheer-accent)/20 transition-all">
                <PhoneInput 
                    id={id}
                    name={name} 
                    value={val} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(e.target.value)} 
                    className="bg-transparent text-xs text-(--beheer-text) font-semibold outline-none h-7 w-full border-none p-0 focus:ring-0"
                />
            </div>
        </div>
    );
}

export function HorizontalSelect({ label, name, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; children: React.ReactNode }) {
    const options = parseOptionsFromChildren(children);

    const handleSelectChange = (val: string | number) => {
        if (props.onChange) {
            const event = {
                target: {
                    name,
                    id: props.id,
                    value: val
                },
                currentTarget: {
                    name,
                    id: props.id,
                    value: val
                }
            } as React.ChangeEvent<HTMLSelectElement>;
            props.onChange(event);
        }
    };

    return (
        <div className="flex items-center gap-3 py-0.5 group relative">
            <label className="w-28 shrink-0 text-[10px] font-semibold text-(--beheer-text-muted) opacity-50 group-hover:opacity-100 transition-all">
                {label}
            </label>
            <div className="flex-1">
                <AdminSelect
                    name={name}
                    defaultValue={props.defaultValue as string | number}
                    value={props.value as string | number}
                    onChange={handleSelectChange}
                    options={options}
                    disabled={props.disabled}
                    size="sm"
                />
            </div>
        </div>
    );
}

export function HorizontalTextarea({ label, name, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string }) {
    const id = React.useId();
    return (
        <div className="flex flex-col gap-1 py-1 group">
            <label htmlFor={id} className="text-[10px] font-semibold text-(--beheer-text-muted) opacity-50 group-hover:opacity-100 group-focus-within:text-(--beheer-accent) group-focus-within:opacity-100 transition-all cursor-pointer">{label}</label>
            <textarea 
                {...props} 
                id={id}
                name={name}
                className="w-full bg-slate-500/5 dark:bg-black/40 rounded-xl p-2.5 text-xs text-(--beheer-text) font-semibold outline-none placeholder:opacity-20 min-h-[45px] resize-none border border-(--beheer-border)/5 transition-all focus:border-(--beheer-accent)/30"
            />
        </div>
    );
}

export function HorizontalCheckbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
                <input type="checkbox" {...props} className="sr-only peer" />
                <div className="h-4 w-7 bg-(--beheer-text-muted)/10 rounded-full peer-checked:bg-(--beheer-accent) transition-all" />
                <div className="absolute left-0.5 top-0.5 h-3 w-3 bg-white rounded-full transition-all peer-checked:left-3.5 shadow-sm" />
            </div>
            <span className="text-[10px] font-semibold text-(--beheer-text-muted) opacity-50 group-hover:opacity-100 transition-all">{label}</span>
        </label>
    );
}
