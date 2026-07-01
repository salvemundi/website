import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface SafeMarkdownProps {
    content: string | null | undefined;
    className?: string;
}

export function SafeMarkdown({ content, className = '' }: SafeMarkdownProps) {
    if (!content) return null;

    return (
        <div className={`prose prose-purple max-w-none dark:prose-invert ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkBreaks, remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
