'use client';

import React, { useState, useEffect } from 'react';

interface DeletionTimerProps {
    expiryDateStr: string;
}

export default function DeletionTimer({ expiryDateStr }: DeletionTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number } | null>(null);

    useEffect(() => {
        if (!expiryDateStr) return;

        // Based on retention policy: 2 years after expiry
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
        <div className="animate-in zoom-in mb-6 fade-in rounded-2xl border border-theme-purple/20 bg-theme-purple/5 p-4 text-center duration-500">
            <p className="mb-2 text-xs font-bold tracking-wider text-theme-purple uppercase">
                ⚠️ Account Verwijdering (AVG)
            </p>
            <p className="mb-3 text-sm text-(--text-muted)">
                Je lidmaatschap is verlopen. Als je niet verlengt, worden je gegevens permanent verwijderd over:
            </p>
            <div className="font-mono text-2xl font-bold text-theme-purple">
                {timeLeft.days}d {timeLeft.hours}u {timeLeft.minutes}m
            </div>
        </div>
    );
}
