"use client";

import React from 'react';
import { motion } from 'framer-motion';

type Variant = 'float' | 'rotate' | 'pulse';

interface AnimatedIconCardProps {
    icon: React.ReactNode;
    title: string;
    children?: React.ReactNode;
    iconBgClass?: string;
    variant?: Variant;
    className?: string;
}

const variantsMap = {
    float: {
        rest: { y: 0 },
        hover: {
            y: [0, -6, 0],
            transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
        },
    },
    rotate: {
        rest: { rotate: 0 },
        hover: {
            rotate: [0, 360],
            transition: { duration: 0.9, repeat: Infinity, ease: 'linear' },
        },
    },
    pulse: {
        rest: { scale: 1 },
        hover: {
            scale: [1, 1.08, 1],
            transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
        },
    },
} as const;

export default function AnimatedIconCard({ icon, title, children, iconBgClass = '', variant = 'float', className = '' }: AnimatedIconCardProps) {
    const chosen = variantsMap[variant];

    return (
        <motion.article initial="rest" whileHover="hover" className={`group relative rounded-3xl bg-[var(--bg-card)] p-8 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl ${className}`}>
            <motion.div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${iconBgClass}`} variants={chosen}>
                {icon}
            </motion.div>

            <h3 className="mb-4 text-xl font-bold text-theme">{title}</h3>

            <div className="text-theme-muted leading-relaxed">{children}</div>
        </motion.article>
    );
}
