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
        <div className="form-input flex flex-wrap items-center gap-2 min-h-12 py-2">
            {value.map((tag) => (
                <span key={tag} className="flex items-center gap-1 bg-(--bg-soft) text-(--theme-purple) text-xs font-bold px-2.5 py-1 rounded-full">
                    {tag}
                    <button
                        type="button"
                        onClick={() => onChange(value.filter((t) => t !== tag))}
                        className="icon-button hover:text-(--theme-error)"
                        aria-label={`Verwijder ${tag}`}
                    >
                        <X className="h-3 w-3" />
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
                className="form-input-tag flex-1 min-w-[8ch] bg-transparent outline-none border-none p-0 text-sm"
            />
        </div>
    );
}
