import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'ghost' | 'purple';
    size?: 'sm' | 'md' | 'lg';
}

const getVariantClass = (variant: 'default' | 'ghost' | 'purple') => {
    switch (variant) {
        case 'ghost':
            return 'bg-transparent hover:bg-theme-purple/10 text-text-main';
        case 'purple':
            return 'bg-theme-purple/90 hover:bg-theme-purple text-wit-paars';
        case 'default':
        default:
            return 'hover:bg-theme-purple/20 text-theme-purple';
    }
};

const getSizeClass = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
        case 'sm':
            return 'p-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0';
        case 'lg':
            return 'p-3 min-w-[48px] min-h-[48px]';
        case 'md':
        default:
            return 'p-2 min-w-[44px] min-h-[44px]';
    }
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
        const baseStyles = 'icon-button inline-flex items-center justify-center transition-colors rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none touch-manipulation active:scale-95';

        return (
            <button
                ref={ref}
                type="button"
                className={cn(baseStyles, getVariantClass(variant), getSizeClass(size), className)}
                {...props}
            >
                {children}
            </button>
        );
    }
);

IconButton.displayName = 'IconButton';