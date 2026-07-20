'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { toggleReisVisibility } from '@/server/actions/admin/reis/admin-reis-core.actions';

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
            <AdminVisibilityToggle
                isVisible={isVisible}
                onToggle={handleToggle}
                isPending={isPending}
            />
            {toast && <AdminToast toast={toast} onClose={hideToast} />}
        </>
    );
}