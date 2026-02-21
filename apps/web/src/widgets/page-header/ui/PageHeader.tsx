'use client';

import { useEffect, useRef, useMemo, useState, Fragment, type FC, type ReactNode } from "react";
import Image from 'next/image';
import { stripHtml } from '@/shared/lib/text';

interface PageHeaderProps {
    title: string;
    backgroundImage?: string;
    backgroundPosition?: string;
    imageFilter?: string;
    className?: string;
    titleClassName?: string;
    children?: ReactNode;
    variant?: 'centered' | 'split';
    description?: ReactNode;
    contentPadding?: string;
    backLink?: string;
    overlayClassName?: string;
}



const PageHeader: FC<PageHeaderProps> = ({
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
    contentPadding = 'py-20',
    overlayClassName = "bg-black/10"
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

    const effectiveImageFilter = useMemo(() => {
        const base = imageFilter || 'brightness(0.7)';
        return /blur\(/.test(base) ? base : `${base} blur(0px)`;
    }, [imageFilter]);

    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const check = () => setIsDark(document.documentElement.classList.contains('dark'));
        check();
        const mo = new MutationObserver(check);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => mo.disconnect();
    }, []);

    return (
        <header ref={headerRef} className={`relative flex items-center justify-center mb-5 ${className}`}>
            {backgroundImage ? (
                <div className="absolute inset-0 z-0">
                    <Image
                        src={backgroundImage}
                        alt={typeof title === 'string' ? title : 'banner'}
                        fill
                        sizes="100vw"
                        className="object-cover"
                        style={{ objectPosition: backgroundPosition, filter: effectiveImageFilter }}
                        priority
                    />
                </div>
            ) : (
                <div className="absolute inset-0 bg-gradient-theme-page-alt transition-colors duration-500 z-0" />
            )}
            {/* Subtle overlay for better text contrast if needed */}
            <div className={`absolute inset-0 z-10 ${overlayClassName}`} />

            <div className={`relative z-20 w-full max-w-app px-4 ${contentPadding} ${variant === 'centered' ? 'text-center' : ''}`}>
                {variant === 'centered' ? (
                    <>
                        {/* Back link intentionally removed site-wide */}
                        <h1 className={`text-theme-purple dark:!text-white font-bold leading-tight drop-shadow-lg shadow-black/50 ${titleClassName}`} style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)', color: isDark ? '#ffffff' : undefined }}>
                            {title.split('\n').map((line, index) => (
                                <Fragment key={index}>
                                    {line}
                                    {index < title.split('\n').length - 1 && <br />}
                                </Fragment>
                            ))}
                        </h1>
                        {description && <div className="mt-4 text-center mx-auto">{typeof description === 'string' ? stripHtml(description) : description}</div>}
                        {children}
                    </>
                ) : (
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="flex-1 text-center lg:text-left">
                            <h1 className={`text-theme-purple dark:!text-white font-bold leading-tight drop-shadow-lg whitespace-normal break-words ${titleClassName}`} style={{ color: isDark ? '#ffffff' : undefined }}>
                                {title.split('\n').map((line, index) => (
                                    <Fragment key={index}>
                                        {line}
                                        {index < title.split('\n').length - 1 && <br />}
                                    </Fragment>
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
