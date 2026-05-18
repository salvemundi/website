import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
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
                remarkPlugins={[remarkBreaks]}
                rehypePlugins={[rehypeSanitize]}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
