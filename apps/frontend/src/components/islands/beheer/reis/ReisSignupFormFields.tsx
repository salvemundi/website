import React from 'react';
import { DateInput } from '@/shared/ui/DateInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import BeheerSelect, { AdminSelectOption } from '@/components/ui/beheer/BeheerSelect';

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
            <label className="form-label-sm">{label}</label>
            <div className="relative">
                <DateInput 
                    name={name} 
                    value={val} 
                    onChange={(newVal) => setVal(newVal)}
                    autoComplete="off"
                    className="form-input"
                />
            </div>
        </div>
    );
}

export function PhoneAndLabel({ label, defaultValue, name }: { label: string; defaultValue: string; name: string }) {
    const [val, setVal] = React.useState(defaultValue);
    return (
        <div className="group/field space-y-1.5">
            <label className="form-label-sm">{label}</label>
            <div className="relative">
                <PhoneInput 
                    name={name} 
                    value={val} 
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setVal(event.target.value)}
                    autoComplete="off"
                    className="form-input"
                />
            </div>
        </div>
    );
}

export function Input({ label, ...props }: FieldProps) {
    return (
        <div className="group/field space-y-1.5">
            <label className="form-label-sm">{label}</label>
            <input 
                {...props} 
                className={`form-input w-full ${props.className || ''}`}
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
            <label className="form-label-sm">
                {label}
            </label>
            <BeheerSelect
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
            <label className="form-label-sm">{label}</label>
            <textarea 
                {...props} 
                className="form-input min-h-20 resize-none"
            />
        </div>
    );
}

export function Checkbox({ label, ...props }: FieldProps) {
    return (
        <label className="form-label-checkbox">
            <div className="relative">
                <input type="checkbox" {...props} className="peer sr-only" />
                <div className="toggle-switch-track" />
                <div className="toggle-switch-thumb" />
            </div>
            <div className="flex flex-col">
                <span className="toggle-switch-label">{label}</span>
            </div>
        </label>
    );
}

// --- Horizontal (Cockpit) Fields ---

export function HorizontalInput({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
    const id = React.useId();
    return (
        <div className="form-row-horizontal">
            <label htmlFor={id} className="form-label-horizontal">{label}</label>
            <div className="search-bar flex-1">
                <input 
                    {...props} 
                    id={id}
                    name={name}
                    className={`form-input-borderless ${props.className || ''}`}
                />
            </div>
        </div>
    );
}

export function HorizontalDate({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
    const [val, setVal] = React.useState(defaultValue);
    const id = React.useId();
    return (
        <div className="form-row-horizontal">
            <label htmlFor={id} className="form-label-horizontal">{label}</label>
            <div className="search-bar flex-1">
                <DateInput 
                    id={id}
                    name={name} 
                    value={val} 
                    onChange={(nv) => setVal(nv)} 
                    className="form-input-borderless"
                />
            </div>
        </div>
    );
}

export function HorizontalPhone({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
    const [val, setVal] = React.useState(defaultValue);
    const id = React.useId();
    return (
        <div className="form-row-horizontal">
            <label htmlFor={id} className="form-label-horizontal">{label}</label>
            <div className="search-bar flex-1">
                <PhoneInput 
                    id={id}
                    name={name} 
                    value={val} 
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setVal(event.target.value)} 
                    className="form-input-borderless"
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
        <div className="relative form-row-horizontal">
            <label className="form-label-horizontal">
                {label}
            </label>
            <div className="flex-1">
                <BeheerSelect
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
        <div className="form-row-vertical">
            <label htmlFor={id} className="form-label-vertical">{label}</label>
            <textarea 
                {...props} 
                id={id}
                name={name}
                className="form-input min-h-12 resize-none p-2.5"
            />
        </div>
    );
}

export function HorizontalCheckbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <label className="form-label-checkbox-sm">
            <div className="relative">
                <input type="checkbox" {...props} className="peer sr-only" />
                <div className="toggle-switch-track-sm" />
                <div className="toggle-switch-thumb-sm" />
            </div>
            <span className="toggle-switch-label">{label}</span>
        </label>
    );
}
