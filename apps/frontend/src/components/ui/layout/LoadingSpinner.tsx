'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    size?: number;
    className?: string;
}

export default function LoadingSpinner({ size = 48, className = '' }: LoadingSpinnerProps) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="relative" style={{ width: size, height: size }}>
                {/* Outer Ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-[var(--color-purple-500)]/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
                {/* Spinning Gradient Ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-t-[var(--color-purple-500)] border-r-[var(--color-purple-300)] border-b-transparent border-l-transparent"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
                {/* Center Pulse */}
                <motion.div
                    className="absolute inset-4 rounded-full bg-gradient-to-tr from-[var(--color-purple-500)] to-[var(--color-purple-300)]"
                    animate={{ scale: [0.8, 1, 0.8], opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>
        </div>
    );
}
