'use client';

import React, { useState, useEffect } from 'react';

interface FlipClockProps {
    targetDate: string;
}

const FlipClock: React.FC<FlipClockProps> = ({ targetDate }) => {
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
        <div className="flex gap-4 justify-center items-center mt-8">
            <FlipUnit value={formatTime(timeLeft.days)} label="DAGEN" />
            <FlipUnit value={formatTime(timeLeft.hours)} label="UREN" />
            <FlipUnit value={formatTime(timeLeft.minutes)} label="MINUTEN" />
            <FlipUnit value={formatTime(timeLeft.seconds)} label="SECONDEN" />
        </div>
    );
};

const FlipUnit = ({ value, label }: { value: string | number, label: string }) => {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative bg-neutral-800 text-white rounded-lg p-3 sm:p-4 w-16 sm:w-20 h-20 sm:h-24 flex items-center justify-center shadow-lg border border-neutral-700">
                {/* Top Half Highlight */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/5 rounded-t-lg border-b border-black/20"></div>

                {/* Horizontal Split Line */}
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/40 z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>

                {/* Side Notches */}
                <div className="absolute top-1/2 -left-1 w-2 h-2 bg-[#121212] rounded-full -translate-y-1/2 z-20"></div>
                <div className="absolute top-1/2 -right-1 w-2 h-2 bg-[#121212] rounded-full -translate-y-1/2 z-20"></div>

                <span className="text-3xl sm:text-4xl font-bold font-mono z-0 tracking-wider">
                    {value}
                </span>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-theme-purple tracking-widest">
                {label}
            </span>
        </div>
    );
};

export default FlipClock;
