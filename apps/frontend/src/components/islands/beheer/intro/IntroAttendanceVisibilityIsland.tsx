'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import BeheerVisibilityToggle from '@/components/ui/beheer/BeheerVisibilityToggle';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { toggleIntroAttendanceVisibility } from '@/server/actions/beheer/intro/beheer-intro-core.actions';

interface Props {
    initialVisible: boolean;
}

export default function IntroAttendanceVisibilityIsland({ initialVisible }: Props) {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(initialVisible);
    const [isPending, startTransition] = useTransition();
    const { showToast } = useAdminToast();

    const handleToggle = () => {
        startTransition(async () => {
            try {
                const res = await toggleIntroAttendanceVisibility();
                if (res.success) {
                    setIsVisible(res.visible ?? false);
                    showToast(`Aanwezigheid is nu ${res.visible ? 'zichtbaar' : 'verborgen'}`, 'success');
                    router.refresh();
                } else {
                    showToast(res.error || 'Bijwerken mislukt', 'error');
                }
            } catch {
                showToast('Er is een onverwachte fout opgetreden', 'error');
            }
        });
    };

    return (
        <BeheerVisibilityToggle
            isVisible={isVisible}
            onToggle={handleToggle}
            isPending={isPending}
            label="Aanwezigheid zichtbaar"
        />
    );
}
