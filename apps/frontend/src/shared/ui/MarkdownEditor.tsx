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
    { label: 'Vet', icon: <Bold className="h-4 w-4" />, before: '**', after: '**' },
    { label: 'Cursief', icon: <Italic className="h-4 w-4" />, before: '*', after: '*' },
    { label: 'Kop', icon: <Heading2 className="h-4 w-4" />, before: '## ', after: '', block: true },
    { label: 'Lijst', icon: <List className="h-4 w-4" />, before: '- ', after: '', block: true },
    { label: 'Link', icon: <LinkIcon className="h-4 w-4" />, before: '[', after: '](https://)' }
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
        <div className="rounded-xl border border-(--border-color) overflow-hidden bg-(--bg-main)/50">
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-(--bg-soft) border-b border-(--border-color)">
                <div className="flex items-center gap-1">
                    {TOOLBAR_ACTIONS.map((action) => (
                        <button
                            key={action.label}
                            type="button"
                            onClick={() => applyAction(action)}
                            disabled={mode === 'preview'}
                            title={action.label}
                            className="icon-button p-1.5 rounded-lg text-(--text-muted) hover:text-(--theme-purple) hover:bg-(--bg-card) transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {action.icon}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1 p-0.5 bg-(--bg-card) rounded-lg border border-(--border-color)">
                    <button
                        type="button"
                        onClick={() => setMode('edit')}
                        className={`tab-button flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${mode === 'edit' ? 'bg-(--theme-purple) text-white' : 'text-(--text-muted)'}`}
                    >
                        <Pencil className="h-3.5 w-3.5" /> Bewerken
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('preview')}
                        className={`tab-button flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${mode === 'preview' ? 'bg-(--theme-purple) text-white' : 'text-(--text-muted)'}`}
                    >
                        <Eye className="h-3.5 w-3.5" /> Voorbeeld
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
                    className="w-full p-4 bg-transparent outline-none border-none resize-y text-sm text-(--text-main)"
                />
            ) : (
                <div className="p-4 overflow-y-auto" style={{ minHeight: `${rows * 1.5}rem` }}>
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
