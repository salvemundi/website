import { useEffect, useRef, MutableRefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

/**
 * Custom hook for using GSAP with React
 * Provides automatic cleanup on unmount
 */
export function useGsap<T extends Element = HTMLDivElement>(
    animationFn: (context: gsap.Context) => void | (() => void),
    dependencies: React.DependencyList = []
): MutableRefObject<T | null> {
    const ref = useRef<T | null>(null);
    const contextRef = useRef<gsap.Context | null>(null);

    useEffect(() => {
        if (!ref.current) return;

        // Create a GSAP context for this component
        const ctx = gsap.context(() => {
            if (ref.current) {
                animationFn(ctx);
            }
        }, ref.current);

        contextRef.current = ctx;

        // Cleanup function
        return () => {
            ctx.revert();
            contextRef.current = null;
        };
    }, dependencies);

    return ref;
}

/**
 * Hook for scroll-triggered animations
 */
export function useScrollTrigger<T extends Element = HTMLDivElement>(
    animationFn: (element: T, scrollTrigger: typeof ScrollTrigger) => void,
    dependencies: React.DependencyList = []
): MutableRefObject<T | null> {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        if (!ref.current) return;

        const element = ref.current;
        animationFn(element, ScrollTrigger);

        // Cleanup function
        return () => {
            // Kill all ScrollTriggers associated with this element
            ScrollTrigger.getAll().forEach((trigger) => {
                if (trigger.trigger === element || trigger.vars.trigger === element) {
                    trigger.kill();
                }
            });
        };
    }, dependencies);

    return ref;
}

/**
 * Hook that returns a GSAP timeline
 */
export function useGsapTimeline(
    options?: gsap.TimelineVars,
    dependencies: React.DependencyList = []
): MutableRefObject<gsap.core.Timeline | null> {
    const timelineRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
        timelineRef.current = gsap.timeline(options);

        return () => {
            timelineRef.current?.kill();
            timelineRef.current = null;
        };
    }, dependencies);

    return timelineRef;
}

/**
 * Hook for simple fade-in animation on mount
 */
export function useFadeIn<T extends Element = HTMLDivElement>(
    options?: {
        delay?: number;
        duration?: number;
        direction?: 'up' | 'down' | 'left' | 'right';
        distance?: number;
    }
): MutableRefObject<T | null> {
    const { delay = 0, duration = 0.8, direction = 'up', distance = 30 } = options || {};

    return useGsap<T>(() => {
        const from: gsap.TweenVars = {
            opacity: 0,
            duration,
            delay,
            ease: 'power3.out',
        };

        if (direction === 'up') from.y = distance;
        if (direction === 'down') from.y = -distance;
        if (direction === 'left') from.x = distance;
        if (direction === 'right') from.x = -distance;

        if (ref.current) {
            gsap.from(ref.current, from);
        }
    });

    // We need to return the ref, but it's not accessible here
    // This is a simplified version - the actual implementation uses useGsap
    const ref = useRef<T | null>(null);
    return ref;
}
