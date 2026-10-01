'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BeheerVisibilityToggle from '@/components/ui/beheer/BeheerVisibilityToggle';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { toggleCoboVisibility } from '@/server/actions/beheer/cobo/beheer-cobo.actions';

interface Props {
    initialVisible: boolean;
    canToggle: boolean;
}

export default function CoboVisibilityToggle({ initialVisible, canToggle }: Props) {
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
                const res = await toggleCoboVisibility();
                if (res.success && typeof res.show === 'boolean') {
                    setIsVisible(res.show);
                    showToast(`CoBo is nu ${res.show ? 'zichtbaar' : 'verborgen'}`, 'success');
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
