import Link from 'next/link';
import { ChevronLeft, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BackButtonProps {
    href?: string;
    onClick?: () => void;
    text?: string;
    title?: string;
    className?: string;
    icon?: LucideIcon;
}

/**
 * Standardized Back Button for public and profile pages.
 * Follows the V7.12 "Industrial" design pattern.
 * Supports both Next.js Link and native button (for history.back()).
 */
export default function BackButton({ 
    href, 
    onClick,
    text = "Terug", 
    title, 
    className,
    icon: Icon = ChevronLeft
}: BackButtonProps) {
    const commonClasses = cn(
        "inline-flex items-center gap-2 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--theme-purple)] transition-all active:scale-95 shadow-sm no-underline",
        className
    );

    const content = (
        <>
            <Icon className="h-5 w-5" />
            <span className="text-sm font-bold pr-1">{text}</span>
        </>
    );

    if (onClick) {
        return (
            <button 
                onClick={onClick}
                className={commonClasses}
                title={title || text}
                type="button"
            >
                {content}
            </button>
        );
    }

    return (
        <Link 
            href={href || "/"} 
            className={commonClasses}
            title={title || text}
        >
            {content}
        </Link>
    );
}
