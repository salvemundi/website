import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Typography } from '@mantine/core';

interface SafeMarkdownProps {
    content: string | null | undefined;
}

export function SafeMarkdown({ content }: SafeMarkdownProps) {
    if (!content) return null;

    return (
        <Typography>
            <ReactMarkdown
                remarkPlugins={[remarkBreaks, remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
            >
                {content}
            </ReactMarkdown>
        </Typography>
    );
}
