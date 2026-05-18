'use client';

import { m } from 'framer-motion';

interface LoadingSpinnerProps {
    size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 40 }) => {
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <m.div
                className="absolute inset-0 rounded-full border-4 border-[var(--color-purple-500)]/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            />
            <m.div
                className="absolute inset-0 rounded-full border-4 border-t-[var(--color-purple-500)] border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
        </div>
    );
};
