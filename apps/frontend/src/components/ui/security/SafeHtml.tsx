import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface SafeHtmlProps {
    html: string;
    className?: string;
    as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Renders sanitized HTML content.
 * Prevents XSS attacks by stripping dangerous scripts and attributes.
 */
export const SafeHtml: React.FC<SafeHtmlProps> = ({ 
    html, 
    className, 
    as: Component = 'div' 
}) => {
    // Sanitize HTML on the fly (works on both Server and Client)
    const cleanHtml = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        // Allow common formatting and links
        ADD_ATTR: ['target', 'rel'],
    });

    return (
        <Component
            className={className}
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
    );
};

export default SafeHtml;
