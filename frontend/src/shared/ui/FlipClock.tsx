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
            <div className="relative bg-[var(--bg-card)] text-theme-purple rounded-lg p-2 sm:p-3 w-16 sm:w-20 h-20 sm:h-24 flex items-center justify-center shadow-lg border border-theme-muted overflow-hidden">
                {/* Background Texture/Shine */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent pointer-events-none z-10 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"></div>

                <div className="flex items-center justify-center gap-[1px]">
                    {digits.map((digit, index) => (
                        <SlotDigit key={index} digit={digit} />
                    ))}
                </div>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-theme-muted tracking-widest uppercase">
                {label}
            </span>
        </div>
    );
};

const SlotDigit = ({ digit }: { digit: string }) => {
    return (
        <div className="relative w-5 sm:w-6 h-10 sm:h-12 overflow-hidden flex justify-center">
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={digit}
                    initial={{ y: '100%', filter: 'blur(2px)', opacity: 0 }}
                    animate={{ y: '0%', filter: 'blur(0px)', opacity: 1 }}
                    exit={{ y: '-100%', filter: 'blur(2px)', opacity: 0 }}
                    transition={{
                        y: { type: "spring", stiffness: 200, damping: 25 },
                        opacity: { duration: 0.2 },
                        filter: { duration: 0.2 }
                    }}
                    className="absolute text-3xl sm:text-4xl font-bold font-mono text-theme-purple"
                >
                    {digit}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

export default FlipClock;
