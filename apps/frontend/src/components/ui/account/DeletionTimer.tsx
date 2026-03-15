'use client';

import React, { useState, useEffect } from 'react';

interface DeletionTimerProps {
    expiryDateStr: string;
}

export default function DeletionTimer({ expiryDateStr }: DeletionTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number } | null>(null);

    useEffect(() => {
        if (!expiryDateStr) return;

        // Based on legacy logic: 2 years after expiry
        const expiryDate = new Date(expiryDateStr);
        const deletionDate = new Date(expiryDate);
        deletionDate.setFullYear(deletionDate.getFullYear() + 2);

        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = deletionDate.getTime() - now.getTime();

            if (difference <= 0) {
                return { days: 0, hours: 0, minutes: 0 };
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            return { days, hours, minutes };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const result = calculateTimeLeft();
            setTimeLeft(result);

            if (result.days === 0 && result.hours === 0 && result.minutes === 0) {
                clearInterval(timer);
            }
        }, 60000);

        return () => clearInterval(timer);
    }, [expiryDateStr]);

    if (!timeLeft || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0)) return null;

    return (
        <div className="bg-purple-50 dark:bg-purple-900/10 rounded-2xl p-4 mb-6 text-center border border-purple-100 dark:border-purple-800/20 animate-in fade-in zoom-in duration-500">
            <p className="text-theme-purple dark:text-purple-400 font-bold uppercase text-xs tracking-wider mb-2">
                ⚠️ Account Verwijdering (AVG)
            </p>
            <p className="text-theme-text-muted dark:text-white/60 text-sm mb-3">
                Je lidmaatschap is verlopen. Als je niet verlengt, worden je gegevens permanent verwijderd over:
            </p>
            <div className="text-2xl font-mono font-bold text-theme-purple dark:text-purple-400">
                {timeLeft.days}d {timeLeft.hours}u {timeLeft.minutes}m
            </div>
        </div>
    );
}
