'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Box, Button, Group, Stack, Text, Title } from '@mantine/core';

const flipStyles = `
    @keyframes slideDownIn {
        0% { transform: translateY(-100%); opacity: 0; }
        100% { transform: translateY(0%); opacity: 1; }
    }
    @keyframes slideDownOut {
        0% { transform: translateY(0%); opacity: 1; }
        100% { transform: translateY(100%); opacity: 0; }
    }
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
        <Box
            pos="relative"
            h={{ base: 64, sm: 112, lg: 128 }}
            w={{ base: 32, sm: 56, lg: 64 }}
            style={{
                overflow: 'hidden',
                maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
            }}
        >
            {previous !== null && (
                <Text
                    key={`prev-${previous}`}
                    fw={900}
                    lh={1}
                    fz={{ base: '2.25rem', sm: '3rem', md: '3.75rem' }}
                    pos="absolute"
                    inset={0}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'slideDownOut 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    }}
                    onAnimationEnd={() => setPrevious(null)}
                >
                    {previous}
                </Text>
            )}

            <Text
                key={`curr-${current}`}
                fw={900}
                lh={1}
                fz={{ base: '2.25rem', sm: '3rem', md: '3.75rem' }}
                pos="absolute"
                inset={0}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'slideDownIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                }}
            >
                {current}
            </Text>
        </Box>
    );
};

const FlipBlock: React.FC<{ value: number; label: string }> = ({ value, label }) => {
    const digits = Math.max(value, 0).toString().padStart(2, '0').split('').map(Number);

    return (
        <Stack align="center" gap="xs">
            <Group gap={0}>
                {digits.map((digit, index) => (
                    <FlipDigit key={index} digit={digit} />
                ))}
            </Group>
            <Text size="xs" fw={700} c="brand" style={{ opacity: 0.8 }}>
                {label}
            </Text>
        </Stack>
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
        <Stack align="center" gap="lg">
            <style>{flipStyles}</style>

            {title && (
                <Stack align="center" gap={4} ta="center">
                    <Title order={2} c="brand" style={{ fontSize: 'clamp(1.5rem, 6cqw, 3rem)' }}>
                        {title}
                    </Title>
                    <Text size="md" fw={600} c="brand" style={{ opacity: 0.8 }}>
                        Begint over
                    </Text>
                </Stack>
            )}

            <Group justify="center" align="center" gap="sm" wrap="wrap">
                <FlipBlock value={timeLeft.days} label={timeLeft.days === 1 ? 'Dag' : 'Dagen'} />
                <Text fw={900} c="brand" opacity={0.25} fz={{ base: '1.25rem', sm: '1.875rem', lg: '2.25rem' }} pb="lg" visibleFrom="xs">
                    -
                </Text>
                <FlipBlock value={timeLeft.hours} label="Uur" />
                <Text fw={900} c="brand" opacity={0.25} fz={{ base: '1.25rem', sm: '1.875rem', lg: '2.25rem' }} pb="lg" visibleFrom="xs">
                    -
                </Text>
                <FlipBlock value={timeLeft.minutes} label="Min" />
                <Text fw={900} c="brand" opacity={0.25} fz={{ base: '1.25rem', sm: '1.875rem', lg: '2.25rem' }} pb="lg" visibleFrom="xs">
                    -
                </Text>
                <FlipBlock value={timeLeft.seconds} label="Sec" />
            </Group>

            {href && !isLive && (
                <Button
                    component={Link}
                    href={href}
                    size="lg"
                    rightSection={<ArrowRight size={18} />}
                >
                    Bekijk Activiteit
                </Button>
            )}
        </Stack>
    );
};

export default FlipClock;
