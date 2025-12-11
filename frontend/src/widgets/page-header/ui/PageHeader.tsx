import React from "react";
import { stripHtml } from '@/shared/lib/text';

interface PageHeaderProps {
    title: string;
    backgroundImage?: string;
    backgroundPosition?: string;
    imageFilter?: string;
    className?: string;
    titleClassName?: string;
    children?: React.ReactNode;
    variant?: 'centered' | 'split';
    description?: React.ReactNode;
    // Tailwind padding classes applied to the inner content wrapper (e.g. 'py-20' or 'py-12')
    contentPadding?: string;
}

import { useEffect, useRef } from 'react';

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    backgroundImage = "",
    backgroundPosition = 'center',
    imageFilter,
    className = "",
    // use slightly smaller base size on mobile and allow breaking long words
    titleClassName = "text-3xl sm:text-4xl md:text-6xl",
    children,
    variant = 'centered',
    description,
    contentPadding = 'py-20'
}) => {
    const headerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;
        const setVar = () => {
            const h = Math.ceil(el.getBoundingClientRect().height);
            document.documentElement.style.setProperty('--pageheader-height', `${h}px`);
        };
        setVar();
        const ro = new ResizeObserver(setVar);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <header ref={headerRef} className={`relative flex items-center justify-center mb-5 ${className}`}>
            <div
                className="absolute inset-0 bg-cover z-0"
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundPosition: backgroundPosition,
                    filter: imageFilter || 'brightness(0.7)'
                }}
            />
            <div className="absolute inset-0 bg-gradient-theme/40 z-10" />

            <div className={`relative z-20 w-full max-w-app px-4 ${contentPadding} ${variant === 'centered' ? 'text-center' : ''}`}>
                {variant === 'centered' ? (
                    <>
                        <h1 className={`text-theme-white font-bold leading-tight drop-shadow-lg whitespace-normal break-words ${titleClassName}`}>
                            {title.split('\n').map((line, index) => (
                                <React.Fragment key={index}>
                                    {line}
                                    {index < title.split('\n').length - 1 && <br />}
                                </React.Fragment>
                            ))}
                        </h1>
                        {description && <div className="mt-4">{typeof description === 'string' ? stripHtml(description) : description}</div>}
                        {children}
                    </>
                ) : (
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="flex-1 text-center lg:text-left">
                            <h1 className={`text-theme-purple font-bold leading-tight drop-shadow-lg whitespace-normal break-words ${titleClassName}`}>
                                {title.split('\n').map((line, index) => (
                                    <React.Fragment key={index}>
                                        {line}
                                        {index < title.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </h1>
                            {description && <div className="mt-4">{typeof description === 'string' ? stripHtml(description) : description}</div>}
                        </div>
                        <div className="flex-1 flex justify-center lg:justify-end w-full lg:w-auto">
                            {children}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default PageHeader;
