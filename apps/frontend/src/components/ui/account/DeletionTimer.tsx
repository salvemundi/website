'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, Group, Stack, Text } from '@mantine/core';

interface DeletionTimerProps {
    expiryDateStr: string;
}

export default function DeletionTimer({ expiryDateStr }: DeletionTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);

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
        <Alert mb="lg">
            <Stack align="center" gap="xs" ta="center">
                <Group gap="xs" justify="center">
                    <AlertTriangle size={16} />
                    <Text size="xs" fw={700} tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                        Account Verwijdering (AVG)
                    </Text>
                </Group>
                <Text size="sm" c="dimmed">
                    Je lidmaatschap is verlopen. Als je niet verlengt, worden je gegevens permanent verwijderd over:
                </Text>
                <Text size="xl" fw={700} ff="monospace" c="brand">
                    {timeLeft.days}d {timeLeft.hours}u {timeLeft.minutes}m
                </Text>
            </Stack>
        </Alert>
    );
}
