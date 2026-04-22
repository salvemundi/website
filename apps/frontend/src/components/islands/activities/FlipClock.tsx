'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlipClockProps {
    targetDate: string;
    title?: string;
    href?: string;
    serverTime?: string;
}

const FlipClock: React.FC<FlipClockProps> = ({ targetDate, title, href, serverTime }) => {
    const [timeOffset, setTimeOffset] = useState<number | null>(null);

    const calculateTimeLeft = useCallback(() => {
        const now = new Date();
        const adjustedNow = timeOffset !== null ? now.getTime() + timeOffset : now.getTime();
        const difference = +new Date(targetDate) - adjustedNow;
        
        if (isNaN(difference) || difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        };
    }, [targetDate, timeOffset]);

    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

    useEffect(() => {
        // Calculate the offset between server and client time once
        if (serverTime) {
            const serverDate = new Date(serverTime);
            const clientDate = new Date();
            setTimeOffset(serverDate.getTime() - clientDate.getTime());
        } else {
            setTimeOffset(0);
        }
    }, [serverTime]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        // Sync immediately when the tab becomes visible again
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setTimeLeft(calculateTimeLeft());
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [calculateTimeLeft]);

    const isLive = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

    return (
        <div className="flex flex-col items-center">
            {title && (
                <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-[var(--color-purple-800)] dark:text-[var(--color-purple-200)] uppercase tracking-tight mb-2">
                        {title}
                    </h2>
                    <p className="text-sm sm:text-base font-bold text-[var(--color-purple-600)] dark:text-[var(--color-purple-400)] uppercase tracking-widest opacity-80">
                        Begint over
                    </p>
                </div>
            )}
            
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-3">
                <FlipBlock value={timeLeft.days} label="Dagen" />
                <span className="text-xl sm:text-3xl lg:text-4xl font-black text-[var(--theme-purple)]/20 pb-6">-</span>
                <FlipBlock value={timeLeft.hours} label="Uur" />
                <span className="text-xl sm:text-3xl lg:text-4xl font-black text-[var(--theme-purple)]/20 pb-6">-</span>
                <FlipBlock value={timeLeft.minutes} label="Min" />
                <span className="text-xl sm:text-3xl lg:text-4xl font-black text-[var(--theme-purple)]/20 pb-6">-</span>
                <FlipBlock value={timeLeft.seconds} label="Sec" />
            </div>

            {href && !isLive && (
                <div className="mt-8">
                    <a 
                        href={href}
                        className="group relative inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-purple-600)] hover:bg-[var(--color-purple-700)] text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Bekijk Activiteit
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </span>
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </a>
                </div>
            )}
        </div>
    );
};

interface FlipBlockProps {
    value: number;
    label: string;
}

const FlipBlock: React.FC<FlipBlockProps> = ({ value, label }) => {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex gap-0">
                <FlipDigit digit={Math.floor(value / 10)} />
                <FlipDigit digit={value % 10} />
            </div>
            <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-purple-600)] dark:text-[var(--color-purple-400)] opacity-60">
                {label}
            </span>
        </div>
    );
};

const FlipDigit: React.FC<{ digit: number }> = ({ digit }) => {
    return (
        <div className="relative w-8 h-16 sm:w-14 sm:h-28 lg:w-16 lg:h-32 overflow-hidden"
             style={{ 
                maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
             }}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={digit}
                    initial={{ y: '-100%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{
                        y: { type: "spring", stiffness: 100, damping: 20, mass: 1 },
                        opacity: { duration: 0.3 }
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <span className="text-4xl sm:text-6xl lg:text-8xl font-black font-mono text-[var(--color-purple-800)] dark:text-[var(--color-purple-300)]">
                        {digit}
                    </span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default FlipClock;
