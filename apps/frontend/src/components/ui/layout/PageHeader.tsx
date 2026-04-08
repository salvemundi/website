import React from "react";
import Image from 'next/image';
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
    contentPadding?: string;
    isLoading?: boolean;
    backLink?: string;
}
export default function PageHeader({
    title,
    backgroundImage = "",
    backgroundPosition = 'center',
    imageFilter,
    className = "",
    titleClassName = "text-3xl sm:text-4xl md:text-6xl",
    children,
    variant = 'centered',
    description,
    contentPadding = 'py-20',
    backLink,
    isLoading = false
}: PageHeaderProps) {
    const effectiveImageFilter = (() => {
        const base = imageFilter || 'brightness(0.7)';
        return /blur\(/.test(base) ? base : `${base} blur(0px)`;
    })();

    const hasImage = backgroundImage && typeof backgroundImage === 'string' && backgroundImage.length > 0 && !backgroundImage.includes('undefined');

    if (isLoading) {
        return (
            <header className={`relative flex items-center justify-center mb-5 animate-pulse ${className}`} style={{ minHeight: 'var(--pageheader-height, 300px)' }}>
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800/10 z-0" />
                <div className="relative z-20 w-full max-w-app px-4 text-center">
                    <div className="h-12 w-64 bg-[var(--theme-purple)]/20 rounded-2xl mx-auto mb-6" />
                    <div className="h-4 w-96 bg-[var(--theme-purple)]/10 rounded-full mx-auto" />
                </div>
            </header>
        );
    }

    return (
        <header className={`relative flex items-center justify-center mb-5 ${className}`} style={{ minHeight: 'var(--pageheader-height, 300px)' }}>
            {hasImage ? (
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
                <div className="absolute inset-0 bg-gradient-theme transition-colors duration-500 z-0" />
            )}

            <div className="absolute inset-0 bg-black/10 z-0" />

            <div className={`relative z-20 w-full max-w-app px-4 ${contentPadding} ${variant === 'centered' ? 'text-center' : ''}`}>
                {backLink && (
                    <div className="absolute top-8 left-4 z-30">
                        <a 
                            href={backLink} 
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all shadow-lg ring-1 ring-white/10 group"
                        >
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="20" 
                                height="20" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="transition-transform group-hover:-translate-x-1"
                            >
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                            <span className="font-bold text-sm uppercase tracking-wider">Terug</span>
                        </a>
                    </div>
                )}
                {variant === 'centered' ? (
                    <>
                        <h1 className={`text-[var(--theme-purple)] dark:text-white font-bold leading-tight drop-shadow-lg shadow-black/50 ${titleClassName}`} style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                            {title.split('\n').map((line, index) => (
                                <React.Fragment key={index}>
                                    {line}
                                    {index < title.split('\n').length - 1 && <br />}
                                </React.Fragment>
                            ))}
                        </h1>
                        {description && <div className="mt-4 text-center mx-auto text-[var(--text-main)]">{typeof description === 'string' ? stripHtml(description) : description}</div>}
                        {children}
                    </>
                ) : (
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="flex-1 text-center lg:text-left">
                            <h1 className={`text-[var(--theme-purple)] dark:text-white font-bold leading-tight drop-shadow-lg whitespace-normal break-words ${titleClassName}`}>
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
}
