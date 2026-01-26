'use client';

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { HeroBannerProps } from '../HeroBanner';
import { MouseEvent } from 'react';

export default function ModernHero({
    title,
    subtitle,
    image,
    cta,
    gradient = true,
}: HeroBannerProps) {
    // Mouse tracking for Spotlight effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
        visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                type: 'spring' as const,
                damping: 25,
                stiffness: 100,
            },
        },
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl mb-8 lg:mb-12 group border border-white/10"
            onMouseMove={handleMouseMove}
        >
            {/* Spotlight Overlay */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-2xl lg:rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 z-10"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                          650px circle at ${mouseX}px ${mouseY}px,
                          rgba(255,255,255,0.15),
                          transparent 80%
                        )
                    `,
                }}
            />

            {/* Background Image or Gradient */}
            {image ? (
                <div className="relative w-full h-72 sm:h-96 lg:h-[32rem]">
                    <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        priority={image.priority}
                        className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    />
                    {gradient && (
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a141b]/90 via-[#1a141b]/40 to-transparent" />
                    )}

                    {/* Subtle animated grain overlay */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                    />
                </div>
            ) : (
                <div className="relative w-full h-72 sm:h-96 lg:h-[32rem] bg-gradient-theme overflow-hidden">
                    {/* Animated shapes for empty state */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/10 blur-[100px] rounded-full"
                    />
                </div>
            )}

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 lg:p-16 z-20">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-4xl"
                >
                    <motion.h1
                        variants={itemVariants}
                        className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1] drop-shadow-lg"
                    >
                        {title}
                    </motion.h1>

                    {subtitle && (
                        <motion.p
                            variants={itemVariants}
                            className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-8 lg:mb-10 max-w-2xl font-light leading-relaxed drop-shadow-md"
                        >
                            {subtitle}
                        </motion.p>
                    )}

                    {cta && (
                        <motion.div variants={itemVariants}>
                            <Link
                                href={cta.href}
                                className={`inline-flex items-center gap-3 px-8 py-4 text-base lg:text-lg font-medium rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(164,83,155,0.3)] hover:shadow-[0_0_30px_rgba(164,83,155,0.5)] active:scale-95 ${cta.variant === 'secondary'
                                    ? 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20'
                                    : 'bg-white text-theme-purple hover:bg-theme-purple-50'
                                    }`}
                            >
                                {cta.label}
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
