import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

const getVariantClass = (variant: 'primary' | 'secondary' | 'outline' | 'ghost') => {
    switch (variant) {
        case 'secondary':
            return 'bg-(--bg-main)/60 text-(--text-main) border border-(--border-color)/30 hover:bg-(--bg-main)';
        case 'outline':
            return 'border border-(--border-color) bg-transparent text-(--text-main) hover:bg-(--bg-main)/50';
        case 'ghost':
            return 'bg-transparent text-(--text-main) hover:bg-black/5 dark:hover:bg-white/10';
        case 'primary':
        default:
            return 'bg-(--theme-purple) text-white shadow-md hover:scale-[1.02] active:scale-[0.98]';
    }
};

const getSizeClass = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
        case 'sm':
            return 'px-3 py-1.5 text-xs rounded-lg min-h-[36px]';
        case 'lg':
            return 'px-6 py-3.5 text-base rounded-2xl min-h-[48px]';
        case 'md':
        default:
            return 'px-4 py-2 text-sm rounded-xl min-h-[44px]';
    }
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
        const baseStyles = 'form-button inline-flex items-center justify-center font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none touch-manipulation';

        return (
            <button
                ref={ref}
                className={cn(baseStyles, getVariantClass(variant), getSizeClass(size), fullWidth ? 'w-full' : 'w-auto shrink-0', className)}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';