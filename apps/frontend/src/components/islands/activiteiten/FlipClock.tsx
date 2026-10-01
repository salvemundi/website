'use client';

import React, { useState, useEffect, useCallback } from 'react';

const flipStyles = `
    @keyframes slideDownIn {
        0% { transform: translateY(-100%); opacity: 0; }
        100% { transform: translateY(0%); opacity: 1; }
    }
    @keyframes slideDownOut {
        0% { transform: translateY(0%); opacity: 1; }
        100% { transform: translateY(100%); opacity: 0; }
    }
    .digit-in { animation: slideDownIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
    .digit-out { animation: slideDownOut 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
`;

interface FlipClockProps {
    targetDate: string;
    title?: string;
    href?: string;
    serverTime?: string;
}

const FlipDigit: React.FC<{ digit: number }> = ({ digit }) => {
    const [current, setCurrent] = useState(digit);
    const [previous, setPrevious] = useState<number | null>(null);

    useEffect(() => {
        if (digit !== current) {
            setPrevious(current);
            setCurrent(digit);
        }
    }, [digit, current]);

    return (
        <div className="relative h-16 w-8 overflow-hidden sm:h-28 sm:w-14 lg:h-32 lg:w-16"
            style={{
                maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
            }}>

            {previous !== null && (
                <div
                    key={`prev-${previous}`}
                    className="digit-out absolute inset-0 flex items-center justify-center text-4xl leading-none font-black text-(--text-main) sm:text-5xl md:text-6xl"
                    onAnimationEnd={() => setPrevious(null)}
                >
                    {previous}
                </div>
            )}

            <div
                key={`curr-${current}`}
                className="digit-in absolute inset-0 flex items-center justify-center text-4xl leading-none font-black text-(--text-main) sm:text-5xl md:text-6xl"
            >
                {current}
            </div>
        </div>
    );
};

const FlipBlock: React.FC<{ value: number; label: string }> = ({ value, label }) => {
    const digits = Math.max(value, 0).toString().padStart(2, '0').split('').map(Number);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex gap-0">
                {digits.map((digit, index) => (
                    <FlipDigit key={index} digit={digit} />
                ))}
            </div>
            <span className="text-[10px] font-bold text-purple-600 opacity-70 sm:text-xs dark:text-purple-400">
                {label}
            </span>
        </div>
    );
};

const FlipClock: React.FC<FlipClockProps> = ({ targetDate, title, href, serverTime }) => {
    const [timeOffset, setTimeOffset] = useState<number | null>(null);

    const calculateTimeLeft = useCallback((manualNow?: number) => {
        const now = new Date();
        const adjustedNow = manualNow !== undefined
            ? manualNow
            : (timeOffset !== null ? now.getTime() + timeOffset : now.getTime());
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

    const [timeLeft, setTimeLeft] = useState(() => {
        const initialNow = serverTime ? new Date(serverTime).getTime() : undefined;
        return calculateTimeLeft(initialNow);
    });

    useEffect(() => {
        if (serverTime) {
            const serverDate = new Date(serverTime);
            const clientDate = new Date();
            setTimeOffset(serverDate.getTime() - clientDate.getTime());
        } else {
            setTimeOffset(0);
        }
    }, [serverTime]);

    useEffect(() => {
        if (timeOffset !== null) {
            setTimeLeft(calculateTimeLeft());
        }
    }, [timeOffset, calculateTimeLeft]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

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
            <style>{flipStyles}</style>

            {title && (
                <div className="mb-8 text-center">
                    <h2 className="mb-2 text-[clamp(1.5rem,6cqw,3rem)] font-black tracking-tight text-purple-800 dark:text-purple-200">
                        {title}
                    </h2>
                    <p className="text-sm font-semibold text-purple-600 opacity-80 sm:text-base dark:text-purple-400">
                        Begint over
                    </p>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-3">
                <FlipBlock value={timeLeft.days} label={timeLeft.days === 1 ? 'Dag' : 'Dagen'} />
                <span className="hidden pb-6 text-xl font-black text-(--theme-purple)/20 min-[340px]:block sm:text-3xl lg:text-4xl">-</span>
                <FlipBlock value={timeLeft.hours} label="Uur" />
                <span className="hidden pb-6 text-xl font-black text-(--theme-purple)/20 min-[340px]:block sm:text-3xl lg:text-4xl">-</span>
                <FlipBlock value={timeLeft.minutes} label="Min" />
                <span className="hidden pb-6 text-xl font-black text-(--theme-purple)/20 min-[340px]:block sm:text-3xl lg:text-4xl">-</span>
                <FlipBlock value={timeLeft.seconds} label="Sec" />
            </div>

            {href && !isLive && (
                <div className="mt-8">
                    <a
                        href={href}
                        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-purple-600 px-8 py-4 font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-purple-700 hover:shadow-2xl"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Bekijk Activiteit
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </span>
                        <div className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-300 group-hover:translate-y-0" />
                    </a>
                </div>
            )}
        </div>
    );
};

export default FlipClock;