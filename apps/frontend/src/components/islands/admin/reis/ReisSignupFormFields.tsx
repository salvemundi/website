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
        <div className="group/field space-y-1.5">
            <label className="block px-1 text-[11px] font-semibold text-(--beheer-text-muted) opacity-70 transition-colors group-focus-within/field:text-(--beheer-accent)">{label}</label>
            <div className="relative">
                <DateInput 
                    name={name} 
                    value={val} 
                    onChange={(newVal) => setVal(newVal)}
                    autoComplete="off"
                    className="w-full rounded-xl border border-(--beheer-border)/40 bg-(--bg-main)/40 px-4 py-2.5 text-sm font-semibold text-(--beheer-text) shadow-inner backdrop-blur-sm transition-all outline-none focus:bg-(--bg-main)/80 focus:ring-2 focus:ring-(--beheer-accent) dark:bg-black/20"
                />
            </div>
        </div>
    );
}

export function PhoneAndLabel({ label, defaultValue, name }: { label: string; defaultValue: string; name: string }) {
    const [val, setVal] = React.useState(defaultValue);
    return (
        <div className="group/field space-y-1.5">
            <label className="block px-1 text-[11px] font-semibold text-(--beheer-text-muted) opacity-70 transition-colors group-focus-within/field:text-(--beheer-accent)">{label}</label>
            <div className="relative">
                <PhoneInput 
                    name={name} 
                    value={val} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(e.target.value)}
                    autoComplete="off"
                    className="w-full rounded-xl border border-(--beheer-border)/40 bg-(--bg-main)/40 px-4 py-2.5 text-sm font-semibold text-(--beheer-text) shadow-inner backdrop-blur-sm transition-all outline-none focus:bg-(--bg-main)/80 focus:ring-2 focus:ring-(--beheer-accent) dark:bg-black/20"
                />
            </div>
        </div>
    );
}

export function Input({ label, ...props }: FieldProps) {
    return (
        <div className="group/field space-y-1.5">
            <label className="block px-1 text-[11px] font-semibold text-(--beheer-text-muted) opacity-70 transition-colors group-focus-within/field:text-(--beheer-accent)">{label}</label>
            <input 
                {...props} 
                className={`beheer-input w-full rounded-xl border border-(--beheer-border)/40 bg-(--bg-main)/40 px-4 py-2.5 text-sm font-semibold text-(--beheer-text) shadow-inner backdrop-blur-sm transition-all outline-none placeholder:opacity-30 focus:bg-(--bg-main)/80 focus:ring-2 focus:ring-(--beheer-accent) dark:bg-black/20 ${props.className || ''}`}
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
        <div className="group/field space-y-1.5">
            <label className="block px-1 text-[11px] font-semibold text-(--beheer-text-muted) opacity-70 transition-colors">
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
        <div className="group/field space-y-1.5">
            <label className="block px-1 text-[11px] font-semibold text-(--beheer-text-muted) opacity-70 transition-colors group-focus-within/field:text-(--beheer-accent)">{label}</label>
            <textarea 
                {...props} 
                className="min-h-20 beheer-input w-full resize-none rounded-xl border border-(--beheer-border)/40 bg-(--bg-main)/40 px-4 py-2.5 text-sm leading-relaxed font-semibold text-(--beheer-text) shadow-inner backdrop-blur-sm transition-all outline-none placeholder:opacity-30 focus:bg-(--bg-main)/80 focus:ring-2 focus:ring-(--beheer-accent) dark:bg-black/20"
            />
        </div>
    );
}

export function Checkbox({ label, ...props }: FieldProps) {
    return (
        <label className="group flex cursor-pointer items-center gap-4 select-none">
            <div className="relative">
                <input type="checkbox" {...props} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full border border-(--beheer-border)/30 bg-(--beheer-border)/20 shadow-inner backdrop-blur-md transition-all group-hover:border-(--beheer-accent)/50 peer-checked:bg-(--beheer-accent) dark:bg-white/5" />
                <div className="absolute top-1 left-1 size-3 transform rounded-full bg-white shadow-lg transition-all peer-checked:left-5 peer-active:scale-90" />
            </div>
            <div className="flex flex-col">
                <span className="text-[11px] font-semibold tracking-tight text-(--beheer-text-muted) transition-colors group-hover:text-(--beheer-text)">{label}</span>
            </div>
        </label>
    );
}

// --- Horizontal (Cockpit) Fields ---

export function HorizontalInput({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
    const id = React.useId();
    return (
        <div className="group flex items-center gap-3 py-0.5">
            <label htmlFor={id} className="w-28 shrink-0 cursor-pointer text-[10px] font-semibold text-(--beheer-text-muted) opacity-50 transition-all group-focus-within:text-(--beheer-accent) group-focus-within:opacity-100 group-hover:opacity-100">{label}</label>
            <div className="flex-1 rounded-lg border border-(--beheer-border)/5 bg-slate-500/5 px-3 transition-all group-focus-within:border-(--beheer-accent)/20 dark:bg-black/40">
                <input 
                    {...props} 
                    id={id}
                    name={name}
                    className={`h-7 beheer-input w-full border-none bg-transparent p-0 text-xs font-semibold text-(--beheer-text) outline-none placeholder:opacity-20 focus:ring-0 ${props.className || ''}`}
                />
            </div>
        </div>
    );
}

export function HorizontalDate({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
    const [val, setVal] = React.useState(defaultValue);
    const id = React.useId();
    return (
        <div className="group flex items-center gap-3 py-0.5">
            <label htmlFor={id} className="w-28 shrink-0 cursor-pointer text-[10px] font-semibold text-(--beheer-text-muted) opacity-50 transition-all group-focus-within:text-(--beheer-accent) group-focus-within:opacity-100 group-hover:opacity-100">{label}</label>
            <div className="flex-1 rounded-lg border border-(--beheer-border)/5 bg-slate-500/5 px-3 transition-all group-focus-within:border-(--beheer-accent)/20 dark:bg-black/40">
                <DateInput 
                    id={id}
                    name={name} 
                    value={val} 
                    onChange={(nv) => setVal(nv)} 
                    className="h-7 w-full border-none bg-transparent p-0 text-xs font-semibold text-(--beheer-text) outline-none focus:ring-0"
                />
            </div>
        </div>
    );
}

export function HorizontalPhone({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
    const [val, setVal] = React.useState(defaultValue);
    const id = React.useId();
    return (
        <div className="group flex items-center gap-3 py-0.5">
            <label htmlFor={id} className="w-28 shrink-0 cursor-pointer text-[10px] font-semibold text-(--beheer-text-muted) opacity-50 transition-all group-focus-within:text-(--beheer-accent) group-focus-within:opacity-100 group-hover:opacity-100">{label}</label>
            <div className="flex-1 rounded-lg border border-(--beheer-border)/5 bg-slate-500/5 px-3 transition-all group-focus-within:border-(--beheer-accent)/20 dark:bg-black/40">
                <PhoneInput 
                    id={id}
                    name={name} 
                    value={val} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(e.target.value)} 
                    className="h-7 w-full border-none bg-transparent p-0 text-xs font-semibold text-(--beheer-text) outline-none focus:ring-0"
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
        <div className="group relative flex items-center gap-3 py-0.5">
            <label className="w-28 shrink-0 text-[10px] font-semibold text-(--beheer-text-muted) opacity-50 transition-all group-hover:opacity-100">
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
        <div className="group flex flex-col gap-1 py-1">
            <label htmlFor={id} className="cursor-pointer text-[10px] font-semibold text-(--beheer-text-muted) opacity-50 transition-all group-focus-within:text-(--beheer-accent) group-focus-within:opacity-100 group-hover:opacity-100">{label}</label>
            <textarea 
                {...props} 
                id={id}
                name={name}
                className="min-h-11.25 beheer-input w-full resize-none rounded-xl border border-(--beheer-border)/5 bg-slate-500/5 p-2.5 text-xs font-semibold text-(--beheer-text) transition-all outline-none placeholder:opacity-20 focus:border-(--beheer-accent)/30 dark:bg-black/40"
            />
        </div>
    );
}

export function HorizontalCheckbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <label className="group flex cursor-pointer items-center gap-3">
            <div className="relative">
                <input type="checkbox" {...props} className="peer sr-only" />
                <div className="h-4 w-7 rounded-full bg-(--beheer-text-muted)/10 transition-all peer-checked:bg-(--beheer-accent)" />
                <div className="absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow-sm transition-all peer-checked:left-3.5" />
            </div>
            <span className="text-[10px] font-semibold text-(--beheer-text-muted) opacity-50 transition-all group-hover:opacity-100">{label}</span>
        </label>
    );
}
