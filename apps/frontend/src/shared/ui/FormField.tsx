'use client';

import React, { createContext, useContext, useId } from 'react';

interface FormFieldContextValue {
    inputId: string;
}

const FormFieldContext = createContext<FormFieldContextValue | undefined>(undefined);

export const useFormField = (): FormFieldContextValue => {
    const ctx = useContext(FormFieldContext);
    if (!ctx) {
        throw new Error('useFormField must be used within a <FormField>');
    }
    return ctx;
};

interface ChildProps {
    id?: string;
    children?: React.ReactNode;
}

const injectIdToChildren = (children: React.ReactNode, id: string): React.ReactNode => {
    return React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) {
            return child;
        }

        const childElement = child as React.ReactElement<ChildProps>;
        const type = childElement.type;

        const isFormControl =
            typeof type === 'string' && (type === 'input' || type === 'select' || type === 'textarea');

        const isCustomInput =
            typeof type === 'function' || typeof (type as unknown) === 'object';

        if (isFormControl || isCustomInput) {
            if (!childElement.props.id) {
                return React.cloneElement(childElement, { id });
            }
            return childElement;
        }

        if (childElement.props.children && typeof childElement.props.children !== 'function') {
            return React.cloneElement(childElement, {
                children: injectIdToChildren(childElement.props.children, id),
            });
        }

        return childElement;
    });
};

interface FormFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
    className?: string;
    id?: string;
    labelClassName?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    required,
    error,
    children,
    className = '',
    id,
    labelClassName = '',
}) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const childrenWithId = injectIdToChildren(children, inputId);

    return (
        <FormFieldContext.Provider value={{ inputId }}>
            <div className={`flex flex-col gap-1.5 ${className}`}>
                <label htmlFor={inputId} className={`form-label ${labelClassName}`}>
                    {label}
                    {required && <span className="text-theme-error"> *</span>}
                </label>

                {childrenWithId}

                {error && (
                    <p role="alert" className="text-theme-error text-xs font-bold">
                        {error}
                    </p>
                )}
            </div>
        </FormFieldContext.Provider>
    );
};