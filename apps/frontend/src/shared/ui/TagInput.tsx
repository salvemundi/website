'use client';

import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    id?: string;
}

export function TagInput({ value, onChange, placeholder, id }: TagInputProps) {
    const [draft, setDraft] = useState('');

    const addTag = (raw: string) => {
        const tag = raw.trim();
        if (!tag || value.includes(tag)) {
            setDraft('');
            return;
        }
        onChange([...value, tag]);
        setDraft('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(draft);
        } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    return (
        <div className="flex min-h-12 form-input flex-wrap items-center gap-2 py-2">
            {value.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-(--bg-soft) px-2.5 py-1 text-xs font-bold text-(--theme-purple)">
                    {tag}
                    <button
                        type="button"
                        onClick={() => onChange(value.filter((t) => t !== tag))}
                        className="icon-button hover:text-(--theme-error)"
                        aria-label={`Verwijder ${tag}`}
                    >
                        <X className="size-3" />
                    </button>
                </span>
            ))}
            <input
                id={id}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => addTag(draft)}
                placeholder={value.length === 0 ? placeholder : ''}
                className="form-input-tag min-w-[8ch] flex-1 border-none bg-transparent p-0 text-sm outline-none"
            />
        </div>
    );
}
