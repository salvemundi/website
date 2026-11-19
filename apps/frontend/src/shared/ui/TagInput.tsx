'use client';

import { TagsInput } from '@mantine/core';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    id?: string;
}

export function TagInput({ value, onChange, placeholder, id }: TagInputProps) {
    return (
        <TagsInput
            id={id}
            value={value}
            onChange={(tags) => onChange(Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))))}
            placeholder={value.length === 0 ? placeholder : ''}
            splitChars={[',']}
            acceptValueOnBlur
            clearable={false}
            isDuplicate={(val, current) => current.includes(val.trim())}
        />
    );
}
