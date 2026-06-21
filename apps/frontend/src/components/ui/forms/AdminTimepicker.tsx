import React from 'react';

type AdminTimepickerProps = React.InputHTMLAttributes<HTMLInputElement>;

export const AdminTimepicker = React.forwardRef<HTMLInputElement, AdminTimepickerProps>(({
    className = '',
    onClick,
    ...props
}, ref) => {
    return (
        <div className="relative w-full">
            <input
                type="time"
                ref={ref}
                onClick={(e) => {
                    e.currentTarget.showPicker();
                    if (onClick) onClick(e);
                }}
                suppressHydrationWarning
                className={`beheer-input pr-10 ${className}`}
                {...props}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-(--beheer-text-muted) opacity-60">
                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
            </div>
        </div>
    );
});

AdminTimepicker.displayName = 'AdminTimepicker';
