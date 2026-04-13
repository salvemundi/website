'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface FlipClockProps {
    targetDate: string;
    title?: string;
    href?: string;
    serverTime?: number | string | Date;
}

const FlipClock: React.FC<FlipClockProps> = ({ targetDate, title, href, serverTime }) => {
    const calculateTimeLeft = useCallback(() => {
        const now = serverTime ? new Date(serverTime) : new Date();
        const difference = +new Date(targetDate) - +now;
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
    }, [targetDate, serverTime]);

    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            // After hydration, we switch to calculating based on actual client time
            // but we keep use of serverTime ref if we want to stay perfectly synced
            // for simplicity we just proceed with real-time updates
            const difference = +new Date(targetDate) - +new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const formatTime = (time: number) => {
        return time < 10 ? `0${time}` : `${time}`;
    };

    return (
        <div className="w-full text-center">
            <div className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-[var(--color-purple-200)] mb-2 drop-shadow-md">
                Volgende Activiteit
            </div>

            {title && (
                href ? (
                    <div>
                        <Link href={href} className="text-2xl sm:text-3xl font-extrabold text-[var(--color-white)] hover:text-[var(--color-purple-200)] transition drop-shadow-md block mb-4">
                            {title}
                        </Link>
                    </div>
                ) : (
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-[var(--color-white)] drop-shadow-md mb-4">{title}</div>
                    </div>
                )
            )}

            <div className="flex gap-2 sm:gap-4 justify-center items-center mt-3">
                <SlotUnit value={formatTime(timeLeft.days)} label={timeLeft.days === 1 ? 'DAG' : 'DAGEN'} />
                <SlotUnit value={formatTime(timeLeft.hours)} label={timeLeft.hours === 1 ? 'UUR' : 'UREN'} />
                <SlotUnit value={formatTime(timeLeft.minutes)} label="MIN" />
                <SlotUnit value={formatTime(timeLeft.seconds)} label="SEC" />
            </div>
        </div>
    );
};

const SlotUnit = ({ value, label }: { value: string | number; label: string }) => {
    const stringValue = String(value);
    const digits = stringValue.split('');

    return (
        <div className="flex flex-col items-center gap-1 sm:gap-2">
            <div className="relative p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-gradient-to-b from-[var(--color-purple-400)] to-[var(--color-purple-900)] shadow-xl">
                <div className="relative bg-[var(--bg-main)] rounded-md sm:rounded-lg p-0.5 sm:p-2 min-w-[2.5rem] sm:min-w-[4.5rem] h-14 sm:h-24 flex items-center justify-center overflow-hidden border-2 border-[var(--border-color)]/40">

                    <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_10px_10px_rgba(0,0,0,0.4),inset_0_-10px_10px_rgba(0,0,0,0.4)] sm:shadow-[inset_0_15px_15px_rgba(0,0,0,0.4),inset_0_-15px_15px_rgba(0,0,0,0.4)] rounded-lg"></div>
                    <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-b from-white/10 via-transparent to-white/5 opacity-50 rounded-lg"></div>

                    <div className="flex items-center justify-center gap-[1px] sm:gap-[2px] z-10 h-full px-0.5 sm:px-1">
                        {digits.map((digit, index) => (
                            <SlotDigit key={index} digit={digit} />
                        ))}
                    </div>
                </div>
            </div>

            <span className="text-[9px] sm:text-xs font-bold text-[var(--color-white)] dark:text-[var(--text-muted)] tracking-wide sm:tracking-widest uppercase mt-0.5 sm:mt-1">
                {label}
            </span>
        </div>
    );
};

const SlotDigit = ({ digit }: { digit: string }) => {
    return (
        <div className="relative w-5 sm:w-9 h-full overflow-hidden flex justify-center items-center bg-[var(--bg-card)] rounded-[2px]">
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={digit}
                    initial={{ y: '-100%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '100%' }}
                    transition={{
                        y: { type: "spring", stiffness: 100, damping: 20, mass: 1 },
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-[var(--color-white-mute)] dark:bg-[var(--color-purple-900)] border-x border-[var(--border-color)]/20"
                >
                    <span className="text-xl sm:text-4xl font-black font-mono text-[var(--color-purple-800)] dark:text-[var(--color-purple-300)]"
                        style={{ textShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                        {digit}
                    </span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default FlipClock;
