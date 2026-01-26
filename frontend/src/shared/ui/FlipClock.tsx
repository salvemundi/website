'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface FlipClockProps {
    targetDate: string;
    title?: string;
    href?: string;
}

const FlipClock: React.FC<FlipClockProps> = ({ targetDate, title, href }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        };

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!hasMounted) {
        return null; // Prevent hydration mismatch
    }

    const formatTime = (time: number) => {
        return time < 10 ? `0${time}` : `${time}`;
    };

    return (
        <div className="w-full text-center">
            <div className="text-[0.7rem] sm:text-sm font-semibold uppercase tracking-wider text-theme-muted mb-1">
                Volgende Activiteit
            </div>

            {title && (
                href ? (
                    <div>
                        <Link href={href} className="text-lg sm:text-xl font-bold text-theme-purple hover:text-theme-purple-light transition">
                            {title}
                        </Link>
                    </div>
                ) : (
                    <div>
                        <div className="text-lg sm:text-xl font-bold text-theme-purple">{title}</div>
                    </div>
                )
            )}

            <div className="flex gap-4 justify-center items-center mt-3">
                <SlotUnit value={formatTime(timeLeft.days)} label={timeLeft.days === 1 ? 'DAG' : 'DAGEN'} />
                <SlotUnit value={formatTime(timeLeft.hours)} label={timeLeft.hours === 1 ? 'UUR' : 'UREN'} />
                <SlotUnit value={formatTime(timeLeft.minutes)} label={timeLeft.minutes === 1 ? 'MINUUT' : 'MINUTEN'} />
                <SlotUnit value={formatTime(timeLeft.seconds)} label={timeLeft.seconds === 1 ? 'SECONDE' : 'SECONDEN'} />
            </div>
        </div>
    );
};

const SlotUnit = ({ value, label }: { value: string | number; label: string }) => {
    // Split values into individual characters for per-digit animation
    const stringValue = String(value);
    const digits = stringValue.split('');

    return (
        <div className="flex flex-col items-center gap-2">
            {/* The Machine Case / Bezel */}
            <div className="relative p-1 rounded-xl bg-gradient-to-b from-theme-purple-light to-theme-purple-dark shadow-xl">
                {/* The Recessed Reel Window */}
                <div className="relative bg-[#f0f0f0] dark:bg-[#1a1a1a] rounded-lg p-2 sm:p-3 w-16 sm:w-22 h-20 sm:h-24 flex items-center justify-center overflow-hidden border-2 border-black/20">

                    {/* Inner Shadow (Curved Reel Effect) */}
                    <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_10px_15px_rgba(0,0,0,0.3),inset_0_-10px_15px_rgba(0,0,0,0.3)] rounded-lg"></div>

                    {/* Glass Reflection Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-b from-white/30 to-transparent opacity-50 rounded-lg"></div>

                    {/* Digits */}
                    <div className="flex items-center justify-center gap-1 z-10">
                        {digits.map((digit, index) => (
                            <SlotDigit key={index} digit={digit} />
                        ))}
                    </div>
                </div>
            </div>

            <span className="text-[10px] sm:text-xs font-bold text-theme-muted tracking-widest uppercase mt-1">
                {label}
            </span>
        </div>
    );
};

const SlotDigit = ({ digit }: { digit: string }) => {
    return (
        <div className="relative w-6 sm:w-7 h-10 sm:h-12 overflow-hidden flex justify-center items-center">
            {/* Divider Line between numbers (optional, visual separation) */}
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={digit}
                    initial={{ y: '150%', opacity: 0, filter: 'blur(5px)' }}
                    animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: '-150%', opacity: 0, filter: 'blur(5px)' }}
                    transition={{
                        y: { type: "spring", stiffness: 120, damping: 18, mass: 0.8 },
                        opacity: { duration: 0.2 },
                        filter: { duration: 0.2 }
                    }}
                    className="absolute text-3xl sm:text-4xl font-black font-mono text-theme-purple-dark dark:text-theme-purple-light"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                >
                    {digit}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

export default FlipClock;
