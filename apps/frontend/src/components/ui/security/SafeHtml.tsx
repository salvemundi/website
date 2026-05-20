import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

// Prevent reverse tabnabbing by enforcing rel="noopener noreferrer" on target="_blank" links
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
    }
});

interface SafeHtmlProps {
    html: string;
    className?: string;
    as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Renders sanitized HTML content.
 */
export const SafeHtml: React.FC<SafeHtmlProps> = ({
    html,
    className,
    as: Component = 'div'
}) => {
    const cleanHtml = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ADD_ATTR: ['target', 'rel']
    });

    return (
        <Component
            className={className}
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
    );
};