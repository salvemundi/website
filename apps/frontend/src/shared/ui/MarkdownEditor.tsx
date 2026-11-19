'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Bold, Italic, Heading2, List, Link as LinkIcon, Eye, Pencil } from 'lucide-react';
import { ActionIcon, Box, Center, Group, Paper, SegmentedControl, Text, Textarea } from '@mantine/core';
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
    { label: 'Vet', icon: <Bold size={16} />, before: '**', after: '**' },
    { label: 'Cursief', icon: <Italic size={16} />, before: '*', after: '*' },
    { label: 'Kop', icon: <Heading2 size={16} />, before: '## ', after: '', block: true },
    { label: 'Lijst', icon: <List size={16} />, before: '- ', after: '', block: true },
    { label: 'Link', icon: <LinkIcon size={16} />, before: '[', after: '](https://)' },
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
        <Paper
            radius="md"
            style={{
                overflow: 'hidden',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--mantine-color-body)',
            }}
        >
            <Group
                justify="space-between"
                gap="xs"
                px="xs"
                py={6}
                bg="var(--mantine-color-default)"
                style={{ borderBottom: '1px solid var(--border)' }}
            >
                <Group gap={4}>
                    {TOOLBAR_ACTIONS.map((action) => (
                        <ActionIcon
                            key={action.label}
                            type="button"
                            variant="subtle"
                            color="brand"
                            size="sm"
                            onClick={() => applyAction(action)}
                            disabled={mode === 'preview'}
                            title={action.label}
                            aria-label={action.label}
                        >
                            {action.icon}
                        </ActionIcon>
                    ))}
                </Group>

                <SegmentedControl
                    size="xs"
                    color="brand"
                    value={mode}
                    onChange={(val) => setMode(val as 'edit' | 'preview')}
                    data={[
                        {
                            value: 'edit',
                            label: (
                                <Center style={{ gap: 6 }}>
                                    <Pencil size={13} />
                                    <Text span inherit>Bewerken</Text>
                                </Center>
                            ),
                        },
                        {
                            value: 'preview',
                            label: (
                                <Center style={{ gap: 6 }}>
                                    <Eye size={13} />
                                    <Text span inherit>Voorbeeld</Text>
                                </Center>
                            ),
                        },
                    ]}
                />
            </Group>

            {mode === 'edit' ? (
                <Textarea
                    ref={textareaRef}
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.currentTarget.value)}
                    minRows={rows}
                    autosize
                    variant="unstyled"
                    p="md"
                    placeholder={placeholder}
                />
            ) : (
                <Box p="md" mih={rows * 24} style={{ overflowY: 'auto' }}>
                    {value ? (
                        <SafeMarkdown content={value} />
                    ) : (
                        <Text size="sm" c="dimmed" fs="italic">
                            Nog geen inhoud om weer te geven.
                        </Text>
                    )}
                </Box>
            )}
        </Paper>
    );
}
