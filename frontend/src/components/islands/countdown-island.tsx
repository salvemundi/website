/**
 * CountdownIsland — Interactive Client Component (Island)
 *
 * This is an example "island" — a discrete, interactive client
 * component that hydrates independently from the server-rendered
 * page shell. Only islands use "use client".
 *
 * Architecture: Island Architecture / Public-Safe pattern.
 */
"use client";

import { useEffect, useState } from "react";

interface CountdownIslandProps {
    /** ISO 8601 date string for the target event */
    targetDate: string;
    /** Label to show when the countdown reaches zero */
    expiredLabel?: string;
}

export function CountdownIsland({
    targetDate,
    expiredLabel = "Het evenement is begonnen!",
}: CountdownIslandProps) {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        const target = new Date(targetDate).getTime();

        const tick = () => {
            const now = Date.now();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft(expiredLabel);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft(`${days}d ${hours}u ${minutes}m ${seconds}s`);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [targetDate, expiredLabel]);

    return (
        <div className="text-center font-mono text-2xl font-bold">
            {timeLeft}
        </div>
    );
}
