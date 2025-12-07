'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
                <FlipUnit value={formatTime(timeLeft.days)} label="DAGEN" />
                <FlipUnit value={formatTime(timeLeft.hours)} label="UREN" />
                <FlipUnit value={formatTime(timeLeft.minutes)} label="MINUTEN" />
                <FlipUnit value={formatTime(timeLeft.seconds)} label="SECONDEN" />
            </div>
        </div>
    );
};

const FlipUnit = ({ value, label }: { value: string | number; label: string }) => {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative bg-[var(--bg-card)] text-theme-purple rounded-lg p-3 sm:p-4 w-16 sm:w-20 h-20 sm:h-24 flex items-center justify-center shadow-inner border border-theme-muted">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/3 rounded-t-lg border-b border-black/10"></div>

                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/10 z-10"></div>

                <span className="text-3xl sm:text-4xl font-bold font-mono z-0 tracking-wider text-theme-purple">
                    {value}
                </span>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-theme-muted tracking-widest uppercase">
                {label}
            </span>
        </div>
    );
};

export default FlipClock;
