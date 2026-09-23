'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Bold, Italic, Heading2, List, Link as LinkIcon, Eye, Pencil } from 'lucide-react';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';

interface MarkdownEditorProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}

interface ToolbarAction {
    label: string;
    icon: ReactNode;
    before: string;
    after: string;
    block?: boolean;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
    { label: 'Vet', icon: <Bold className="size-4" />, before: '**', after: '**' },
    { label: 'Cursief', icon: <Italic className="size-4" />, before: '*', after: '*' },
    { label: 'Kop', icon: <Heading2 className="size-4" />, before: '## ', after: '', block: true },
    { label: 'Lijst', icon: <List className="size-4" />, before: '- ', after: '', block: true },
    { label: 'Link', icon: <LinkIcon className="size-4" />, before: '[', after: '](https://)' }
];

export function MarkdownEditor({ id, value, onChange, placeholder, rows = 10 }: MarkdownEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');

    const applyAction = (action: ToolbarAction) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        if (action.block) {
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const newValue = value.slice(0, lineStart) + action.before + value.slice(lineStart);
            onChange(newValue);
            requestAnimationFrame(() => {
                textarea.focus();
                textarea.setSelectionRange(start + action.before.length, end + action.before.length);
            });
            return;
        }

        const selected = value.slice(start, end);
        const placeholderText = selected || 'tekst';
        const insertText = `${action.before}${placeholderText}${action.after}`;
        const newValue = value.slice(0, start) + insertText + value.slice(end);
        onChange(newValue);
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(start + action.before.length, start + action.before.length + placeholderText.length);
        });
    };

    return (
        <div className="overflow-hidden rounded-xl border border-(--border-color) bg-(--bg-main)/50">
            <div className="flex items-center justify-between gap-2 border-b border-(--border-color) bg-(--bg-soft) px-2 py-1.5">
                <div className="flex items-center gap-1">
                    {TOOLBAR_ACTIONS.map((action) => (
                        <button
                            key={action.label}
                            type="button"
                            onClick={() => applyAction(action)}
                            disabled={mode === 'preview'}
                            title={action.label}
                            className="icon-button rounded-lg p-1.5 text-(--text-muted) transition-colors hover:bg-(--bg-card) hover:text-(--theme-purple) disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            {action.icon}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-(--border-color) bg-(--bg-card) p-0.5">
                    <button
                        type="button"
                        onClick={() => setMode('edit')}
                        className={`tab-button flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${mode === 'edit' ? 'bg-(--theme-purple) text-white' : 'text-(--text-muted)'}`}
                    >
                        <Pencil className="size-3.5" /> Bewerken
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('preview')}
                        className={`tab-button flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${mode === 'preview' ? 'bg-(--theme-purple) text-white' : 'text-(--text-muted)'}`}
                    >
                        <Eye className="size-3.5" /> Voorbeeld
                    </button>
                </div>
            </div>

            {mode === 'edit' ? (
                <textarea
                    ref={textareaRef}
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={rows}
                    placeholder={placeholder}
                    className="w-full resize-y border-none bg-transparent p-4 text-sm text-(--text-main) outline-none"
                />
            ) : (
                <div className="overflow-y-auto p-4" style={{ minHeight: `${rows * 1.5}rem` }}>
                    {value ? (
                        <SafeMarkdown content={value} />
                    ) : (
                        <p className="text-sm text-(--text-muted) italic">Nog geen inhoud om weer te geven.</p>
                    )}
                </div>
            )}
        </div>
    );
}
