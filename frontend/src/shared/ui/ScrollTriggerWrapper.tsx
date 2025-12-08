'use client';

import React, { useEffect, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { scrollTriggerAnimation } from '@/shared/lib/gsap/gsapUtils';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

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
    once = false, // Changed default to false to allow replay
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

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
            toggleActions: once ? 'play none none none' : 'play none none reverse',
        });

        // Refresh ScrollTrigger after a short delay to ensure proper positioning
        const timeout = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 100);

        return () => {
            clearTimeout(timeout);
        };
    }, [animation, customAnimation, delay, duration, stagger, triggerStart, once, pathname]);

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
};
