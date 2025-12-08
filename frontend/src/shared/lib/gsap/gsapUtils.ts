import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

/**
 * Common GSAP animation configurations and utilities
 */

export const ANIMATION_DEFAULTS = {
    duration: 0.8,
    ease: 'power3.out',
};

export const STAGGER_DEFAULTS = {
    amount: 0.3,
    ease: 'power2.out',
};

/**
 * Fade in animation with optional direction
 */
export const fadeIn = (
    target: gsap.TweenTarget,
    options?: {
        delay?: number;
        duration?: number;
        direction?: 'up' | 'down' | 'left' | 'right';
        distance?: number;
    }
) => {
    const { delay = 0, duration = ANIMATION_DEFAULTS.duration, direction, distance = 30 } = options || {};

    const from: gsap.TweenVars = {
        opacity: 0,
        ...ANIMATION_DEFAULTS,
        duration,
        delay,
    };

    if (direction === 'up') from.y = distance;
    if (direction === 'down') from.y = -distance;
    if (direction === 'left') from.x = distance;
    if (direction === 'right') from.x = -distance;

    return gsap.from(target, from);
};

/**
 * Fade out animation
 */
export const fadeOut = (
    target: gsap.TweenTarget,
    options?: {
        delay?: number;
        duration?: number;
    }
) => {
    const { delay = 0, duration = ANIMATION_DEFAULTS.duration } = options || {};

    return gsap.to(target, {
        opacity: 0,
        ...ANIMATION_DEFAULTS,
        duration,
        delay,
    });
};

/**
 * Staggered fade in for multiple elements
 */
export const staggerFadeIn = (
    targets: gsap.TweenTarget,
    options?: {
        direction?: 'up' | 'down' | 'left' | 'right';
        distance?: number;
        stagger?: number;
        duration?: number;
    }
) => {
    const { direction = 'up', distance = 30, stagger = 0.1, duration = ANIMATION_DEFAULTS.duration } = options || {};

    const from: gsap.TweenVars = {
        opacity: 0,
        ...ANIMATION_DEFAULTS,
        duration,
        stagger,
    };

    if (direction === 'up') from.y = distance;
    if (direction === 'down') from.y = -distance;
    if (direction === 'left') from.x = distance;
    if (direction === 'right') from.x = -distance;

    return gsap.from(targets, from);
};

/**
 * Scale animation
 */
export const scaleIn = (
    target: gsap.TweenTarget,
    options?: {
        delay?: number;
        duration?: number;
        from?: number;
    }
) => {
    const { delay = 0, duration = ANIMATION_DEFAULTS.duration, from = 0.8 } = options || {};

    return gsap.from(target, {
        scale: from,
        opacity: 0,
        ...ANIMATION_DEFAULTS,
        duration,
        delay,
    });
};

/**
 * Parallax scroll effect
 */
export const createParallax = (
    target: gsap.TweenTarget,
    options?: {
        speed?: number;
        triggerElement?: Element | string;
    }
) => {
    const { speed = 0.5, triggerElement } = options || {};

    return gsap.to(target, {
        y: () => window.innerHeight * speed,
        ease: 'none',
        scrollTrigger: {
            trigger: triggerElement || target,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
        },
    });
};

/**
 * Scroll-triggered animation
 */
export const scrollTriggerAnimation = (
    target: gsap.TweenTarget,
    animation: gsap.TweenVars,
    options?: ScrollTrigger.Vars
) => {
    const defaultOptions: ScrollTrigger.Vars = {
        start: 'top 80%',
        toggleActions: 'play none none none',
        once: true,
    };

    return gsap.from(target, {
        ...animation,
        scrollTrigger: {
            ...defaultOptions,
            ...options,
            trigger: target,
        },
    });
};

/**
 * Text reveal animation (split text by words or characters)
 */
export const textReveal = (
    target: gsap.TweenTarget,
    options?: {
        splitBy?: 'words' | 'chars';
        stagger?: number;
        duration?: number;
    }
) => {
    const { stagger = 0.05, duration = 0.6 } = options || {};

    return gsap.from(target, {
        opacity: 0,
        y: 20,
        duration,
        stagger,
        ease: 'power2.out',
    });
};

/**
 * Magnetic button effect (follows cursor)
 */
export const createMagneticEffect = (button: Element) => {
    const handleMouseMove = (e: MouseEvent) => {
        const { left, top, width, height } = button.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        const deltaX = (e.clientX - centerX) * 0.3;
        const deltaY = (e.clientY - centerY) * 0.3;

        gsap.to(button, {
            x: deltaX,
            y: deltaY,
            duration: 0.3,
            ease: 'power2.out',
        });
    };

    const handleMouseLeave = () => {
        gsap.to(button, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: 'elastic.out(1, 0.3)',
        });
    };

    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
        button.removeEventListener('mousemove', handleMouseMove);
        button.removeEventListener('mouseleave', handleMouseLeave);
    };
};

/**
 * Cleanup all ScrollTrigger instances
 */
export const cleanupScrollTriggers = () => {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
};

/**
 * Refresh ScrollTrigger (useful after DOM changes)
 */
export const refreshScrollTrigger = () => {
    ScrollTrigger.refresh();
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation duration based on user preference
 */
export const getAnimationDuration = (duration: number): number => {
    return prefersReducedMotion() ? 0 : duration;
};
