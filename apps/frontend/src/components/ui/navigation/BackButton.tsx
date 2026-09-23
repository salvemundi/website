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
        "squircle inline-flex items-center gap-2 border border-(--border-color) bg-(--bg-card) p-3 text-(--text-muted) no-underline shadow-sm transition-all hover:text-(--theme-purple) active:scale-95",
        className
    );

    const content = (
        <>
            <Icon className="size-5" />
            <span className="pr-1 text-sm font-bold">{text}</span>
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
