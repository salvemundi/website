'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BeheerVisibilityToggle from '@/components/ui/beheer/BeheerVisibilityToggle';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { toggleReisVisibility } from '@/server/actions/beheer/reis/beheer-reis-core.actions';

interface Props {
    initialVisible: boolean;
    canToggle: boolean;
}

export default function ReisVisibilityToggle({ initialVisible, canToggle }: Props) {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(initialVisible);
    const [isPending, startTransition] = useTransition();
    const { toast, showToast, hideToast } = useAdminToast();

    useEffect(() => {
        setIsVisible(initialVisible);
    }, [initialVisible]);

    const handleToggle = () => {
        if (!canToggle) return;
        startTransition(async () => {
            try {
                const res = await toggleReisVisibility();
                if (res.success) {
                    setIsVisible(res.show ?? false);
                    showToast(`Reis is nu ${res.show ? 'zichtbaar' : 'verborgen'}`, 'success');
                    router.refresh();
                } else {
                    showToast(res.error || 'Bijwerken mislukt', 'error');
                }
            } catch {
                showToast('Er is een onverwachte fout opgetreden', 'error');
            }
        });
    };

    if (!canToggle) return null;

    return (
        <>
            <BeheerVisibilityToggle
                isVisible={isVisible}
                onToggle={handleToggle}
                isPending={isPending}
            />
            {toast && <BeheerToast toast={toast} onClose={hideToast} />}
        </>
    );
}