'use client';

import React from 'react';
import {
    Box,
    Group,
    Input as MantineInput,
    NativeSelect,
    Switch,
    Text,
    Textarea as MantineTextarea,
    TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { PhoneInput } from '@/shared/ui/PhoneInput';

interface SelectOptionItem {
    value: string;
    label: string;
}

const parseOptionsFromChildren = (children: React.ReactNode): SelectOptionItem[] => {
    const list: SelectOptionItem[] = [];
    React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === 'option') {
            const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
            list.push({
                value: String(props.value ?? ''),
                label: typeof props.children === 'string' ? props.children : String(props.children ?? ''),
            });
        }
    });
    return list;
};

function parseDutchDate(input: string): string | null {
    const trimmed = input.trim();
    const dmy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(trimmed);
    if (dmy) {
        const [, d, m, y] = dmy;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    return ymd ? trimmed : null;
}

export function DateAndLabel({
    label,
    defaultValue,
    name,
}: {
    label: string;
    defaultValue: string;
    name: string;
}) {
    const [val, setVal] = React.useState(defaultValue);
    return (
        <DateInput
            label={label}
            name={name}
            value={val || null}
            onChange={(newVal) => setVal(newVal ?? '')}
            valueFormat="DD-MM-YYYY"
            dateParser={parseDutchDate}
            placeholder="dd-mm-jjjj"
            autoComplete="off"
            clearable
        />
    );
}

export function PhoneAndLabel({
    label,
    defaultValue,
    name,
}: {
    label: string;
    defaultValue: string;
    name: string;
}) {
    const [val, setVal] = React.useState(defaultValue);
    return (
        <MantineInput.Wrapper label={label}>
            <Box mt={4}>
                <PhoneInput
                    name={name}
                    value={val}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(e.target.value)}
                    autoComplete="off"
                />
            </Box>
        </MantineInput.Wrapper>
    );
}

export function Input({
    label,
    type,
    name,
    defaultValue,
    value,
    onChange,
    required,
    placeholder,
    disabled,
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <TextInput
            label={label}
            type={type}
            name={name}
            defaultValue={defaultValue as string | number | undefined}
            value={value as string | number | undefined}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
        />
    );
}

export function Select({
    label,
    children,
    name,
    defaultValue,
    value,
    onChange,
    disabled,
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    children: React.ReactNode;
}) {
    const options = parseOptionsFromChildren(children);

    return (
        <NativeSelect
            label={label}
            name={name}
            defaultValue={defaultValue as string | undefined}
            value={value as string | undefined}
            onChange={onChange}
            disabled={disabled}
            data={options}
        />
    );
}

export function Textarea({
    label,
    name,
    defaultValue,
    value,
    onChange,
    placeholder,
    disabled,
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
    return (
        <MantineTextarea
            label={label}
            name={name}
            defaultValue={defaultValue as string | undefined}
            value={value as string | undefined}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            minRows={3}
            autosize
        />
    );
}

export function Checkbox({
    label,
    name,
    defaultChecked,
    checked,
    onChange,
    disabled,
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <Switch
            label={label}
            name={name}
            defaultChecked={defaultChecked}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
        />
    );
}

export function HorizontalInput({
    label,
    name,
    type,
    defaultValue,
    value,
    onChange,
    required,
    placeholder,
    disabled,
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
    const id = React.useId();
    return (
        <Group gap="sm" wrap="nowrap" py={2}>
            <Text
                component="label"
                htmlFor={id}
                w={112}
                size="xs"
                fw={600}
                c="dimmed"
                style={{ flexShrink: 0, cursor: 'pointer' }}
            >
                {label}
            </Text>
            <TextInput
                id={id}
                name={name}
                type={type}
                size="xs"
                flex={1}
                defaultValue={defaultValue as string | number | undefined}
                value={value as string | number | undefined}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                disabled={disabled}
            />
        </Group>
    );
}

export function HorizontalDate({
    label,
    name,
    defaultValue,
}: {
    label: string;
    name: string;
    defaultValue: string;
}) {
    const [val, setVal] = React.useState(defaultValue);
    const id = React.useId();
    return (
        <Group gap="sm" wrap="nowrap" py={2}>
            <Text
                component="label"
                htmlFor={id}
                w={112}
                size="xs"
                fw={600}
                c="dimmed"
                style={{ flexShrink: 0, cursor: 'pointer' }}
            >
                {label}
            </Text>
            <DateInput
                id={id}
                name={name}
                size="xs"
                flex={1}
                value={val || null}
                onChange={(nv) => setVal(nv ?? '')}
                valueFormat="DD-MM-YYYY"
                dateParser={parseDutchDate}
                placeholder="dd-mm-jjjj"
                clearable
            />
        </Group>
    );
}

export function HorizontalPhone({
    label,
    name,
    defaultValue,
}: {
    label: string;
    name: string;
    defaultValue: string;
}) {
    const [val, setVal] = React.useState(defaultValue);
    const id = React.useId();
    return (
        <Group gap="sm" wrap="nowrap" py={2}>
            <Text
                component="label"
                htmlFor={id}
                w={112}
                size="xs"
                fw={600}
                c="dimmed"
                style={{ flexShrink: 0, cursor: 'pointer' }}
            >
                {label}
            </Text>
            <Box flex={1}>
                <PhoneInput
                    id={id}
                    name={name}
                    value={val}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(e.target.value)}
                />
            </Box>
        </Group>
    );
}

export function HorizontalSelect({
    label,
    name,
    children,
    defaultValue,
    value,
    onChange,
    disabled,
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    name: string;
    children: React.ReactNode;
}) {
    const options = parseOptionsFromChildren(children);
    const id = React.useId();

    return (
        <Group gap="sm" wrap="nowrap" py={2}>
            <Text
                component="label"
                htmlFor={id}
                w={112}
                size="xs"
                fw={600}
                c="dimmed"
                style={{ flexShrink: 0 }}
            >
                {label}
            </Text>
            <NativeSelect
                id={id}
                name={name}
                size="xs"
                flex={1}
                defaultValue={defaultValue as string | undefined}
                value={value as string | undefined}
                onChange={onChange}
                disabled={disabled}
                data={options}
            />
        </Group>
    );
}

export function HorizontalTextarea({
    label,
    name,
    defaultValue,
    value,
    onChange,
    placeholder,
    disabled,
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string }) {
    const id = React.useId();
    return (
        <Box py={2}>
            <Text
                component="label"
                htmlFor={id}
                size="xs"
                fw={600}
                c="dimmed"
                display="block"
                mb={4}
                style={{ cursor: 'pointer' }}
            >
                {label}
            </Text>
            <MantineTextarea
                id={id}
                name={name}
                size="xs"
                minRows={2}
                autosize
                defaultValue={defaultValue as string | undefined}
                value={value as string | undefined}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
            />
        </Box>
    );
}

export function HorizontalCheckbox({
    label,
    name,
    defaultChecked,
    checked,
    onChange,
    disabled,
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <Switch
            size="xs"
            label={label}
            name={name}
            defaultChecked={defaultChecked}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
        />
    );
}
