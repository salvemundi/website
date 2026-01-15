'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { scrollTriggerAnimation } from '@/shared/lib/gsap/gsapUtils';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import gsap from 'gsap';

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
    // Trigger slightly earlier so animations start before element is fully in view
    triggerStart = 'top 60%',
    once = false,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    // Ensure animations only run on client after mount
    // Prevents issues with SSR and caching where animations might not initialize properly
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!ref.current || !isMounted) return;

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

        // Ensure elements are visible by default before animation
        gsap.set(targets, { clearProps: 'all' });

        scrollTriggerAnimation(targets, animationConfig, {
            trigger: ref.current,
            start: triggerStart,
            once,
            toggleActions: once ? 'play none none none' : 'play none none reverse',
        });

        // Refresh ScrollTrigger after a short delay
        const timeout = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 100);

        return () => {
            clearTimeout(timeout);
            // Clear all GSAP properties and kill ScrollTriggers on this element
            if (ref.current) {
                const targetsForCleanup = ref.current.children.length > 0 ? ref.current.children : ref.current;
                gsap.set(targetsForCleanup, { clearProps: 'all' });
                ScrollTrigger.getAll().forEach(trigger => {
                    if (trigger.trigger === ref.current) {
                        trigger.kill();
                    }
                });
            }
        };
    }, [animation, customAnimation, delay, duration, stagger, triggerStart, once, pathname, isMounted]);

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
};
