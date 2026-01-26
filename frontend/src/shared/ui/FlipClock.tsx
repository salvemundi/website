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
            <div className="text-sm sm:text-base font-bold uppercase tracking-wider text-purple-100 mb-2 drop-shadow-md">
                Volgende Activiteit
            </div>

            {title && (
                href ? (
                    <div>
                        <Link href={href} className="text-xl sm:text-2xl font-extrabold text-white hover:text-purple-100 transition drop-shadow-md">
                            {title}
                        </Link>
                    </div>
                ) : (
                    <div>
                        <div className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-md">{title}</div>
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
                <div className="relative bg-[#111] rounded-lg p-1 sm:p-2 min-w-[3.5rem] sm:min-w-[4.5rem] h-20 sm:h-24 flex items-center justify-center overflow-hidden border-2 border-black/20">

                    {/* Inner Shadow (Curved Reel Effect) */}
                    <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_15px_15px_rgba(0,0,0,0.4),inset_0_-15px_15px_rgba(0,0,0,0.4)] rounded-lg"></div>

                    {/* Glass Reflection Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-b from-white/10 via-transparent to-white/5 opacity-50 rounded-lg"></div>

                    {/* Digits Container */}
                    <div className="flex items-center justify-center gap-[2px] z-10 h-full px-1">
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
        <div className="relative w-7 sm:w-9 h-full overflow-hidden flex justify-center items-center bg-[#1a1a1a] rounded-[2px]">
            {/* The moving reel tape */}
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={digit}
                    initial={{ y: '-100%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '100%' }}
                    transition={{
                        y: { type: "spring", stiffness: 100, damping: 20, mass: 1 },
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-[#f0f0f0] dark:bg-[#2a2a2a] border-x border-black/10"
                >
                    <span className="text-3xl sm:text-4xl font-black font-mono text-theme-purple-dark dark:text-theme-purple-light"
                        style={{ textShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                        {digit}
                    </span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default FlipClock;
