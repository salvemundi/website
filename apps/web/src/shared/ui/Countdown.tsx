'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
    targetDate: string;
    title: string;
    onSignup?: () => void;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, title, onSignup }) => {
    const countdownDate = new Date(targetDate).getTime();

    const calculateTimeLeft = () => {
        const now = new Date().getTime();
        const distance = countdownDate - now;

        if (distance < 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
    };

    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        setTimeLeft(calculateTimeLeft());
        setIsLoading(false);

        const interval = setInterval(() => {
            const updated = calculateTimeLeft();
            setTimeLeft(updated);

            if (updated.days === 0 && updated.hours === 0 && updated.minutes === 0 && updated.seconds === 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [countdownDate]);

    const formatTime = (time: number) => {
        return time < 10 ? `0${time}` : `${time}`;
    };

    const countdownBlocks = [
        { label: timeLeft.days === 1 ? 'Dag' : 'Dagen', value: formatTime(timeLeft.days) },
        { label: timeLeft.hours === 1 ? 'Uur' : 'Uren', value: formatTime(timeLeft.hours) },
        { label: timeLeft.minutes === 1 ? 'Minuut' : 'Minuten', value: formatTime(timeLeft.minutes) },
        { label: timeLeft.seconds === 1 ? 'Seconde' : 'Seconden', value: formatTime(timeLeft.seconds) },
    ];

    return (
        <section className="w-full bg-[#1A1A3C] rounded-3xl shadow-lg p-4 sm:p-8 text-white">
            <h2 className="text-xl sm:text-2xl font-bold text-[#FDD835] mb-3 sm:mb-4 text-center">Volgende Activiteit:</h2>
            <h3 className="text-2xl sm:text-4xl font-bold text-[#FDD835] mb-4 sm:mb-6 text-center">{title}</h3>
            <div className="flex w-full justify-between gap-3 sm:gap-5 text-center max-w-4xl mx-auto flex-nowrap">
                {isLoading ? (
                    <div className="flex w-full justify-between gap-3 sm:gap-5 text-center max-w-4xl mx-auto">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex-1 min-w-[70px] max-w-[160px] mx-auto">
                                <div className="rounded-t-[16px] sm:rounded-t-[32px] rounded-b-none bg-gray-300 dark:bg-gray-700 px-4 py-6 sm:py-8 shadow-inner flex items-center justify-center animate-pulse">
                                    <span className="h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded" />
                                </div>
                                <div className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-100 font-semibold rounded-b-[16px] sm:rounded-b-[32px] rounded-t-none px-4 py-2 text-xs sm:text-sm uppercase tracking-wide -mt-1 shadow" />
                            </div>
                        ))}
                    </div>
                ) : (
                    countdownBlocks.map(({ label, value }) => (
                        <div key={label} className="flex-1 min-w-[70px] max-w-[160px] mx-auto">
                            <div className="rounded-t-[16px] sm:rounded-t-[32px] rounded-b-none bg-[#5A3859] text-white px-4 py-6 sm:py-8 shadow-inner flex items-center justify-center">
                                <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-wider">{value}</span>
                            </div>
                            <div className="bg-[#FDD835] text-white dark:text-[#1A1A3C] font-semibold rounded-b-[16px] sm:rounded-b-[32px] rounded-t-none px-4 py-2 text-xs sm:text-sm uppercase tracking-wide -mt-1 shadow">
                                {label}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {onSignup && (
                <div className="flex justify-center mt-4 sm:mt-6">
                    <button
                        onClick={onSignup}
                        className="bg-[#5A3859] text-white py-2 px-6 rounded-lg text-base sm:text-lg hover:bg-opacity-80 hover:scale-105 transition-all duration-300 ease-in-out transform w-full sm:w-auto shadow-lg hover:shadow-xl"
                    >
                        Meld je Aan
                    </button>
                </div>
            )}
        </section>
    );
};

export default Countdown;
