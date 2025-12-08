'use client';

import React, { useEffect, useRef, ReactNode } from 'react';
import { scrollTriggerAnimation } from '@/shared/lib/gsap/gsapUtils';

interface ScrollTriggerWrapperProps {
    children: ReactNode;
    animation?: 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale' | 'custom';
    customAnimation?: gsap.TweenVars;
    delay?: number;
    duration?: number;
    stagger?: number;
    className?: string;
    triggerStart?: string;
    once?: boolean;
}

/**
 * Wrapper component that applies scroll-triggered animation to its children
 */
export const ScrollTriggerWrapper: React.FC<ScrollTriggerWrapperProps> = ({
    children,
    animation = 'fade',
    customAnimation,
    delay = 0,
    duration = 0.8,
    stagger = 0,
    className = '',
    triggerStart = 'top 80%',
    once = true,
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        let animationConfig: gsap.TweenVars = {};

        if (customAnimation) {
            animationConfig = { ...customAnimation, delay, duration };
        } else {
            switch (animation) {
                case 'fade':
                    animationConfig = { opacity: 0, delay, duration };
                    break;
                case 'slide-up':
                    animationConfig = { opacity: 0, y: 50, delay, duration };
                    break;
                case 'slide-left':
                    animationConfig = { opacity: 0, x: 50, delay, duration };
                    break;
                case 'slide-right':
                    animationConfig = { opacity: 0, x: -50, delay, duration };
                    break;
                case 'scale':
                    animationConfig = { opacity: 0, scale: 0.8, delay, duration };
                    break;
            }
        }

        if (stagger > 0) {
            animationConfig.stagger = stagger;
        }

        const targets = ref.current.children.length > 0 ? ref.current.children : ref.current;

        scrollTriggerAnimation(targets, animationConfig, {
            trigger: ref.current,
            start: triggerStart,
            once,
        });

        // Cleanup is handled by scrollTriggerAnimation
    }, [animation, customAnimation, delay, duration, stagger, triggerStart, once]);

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
};
