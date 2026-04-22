'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { toggleIntroVisibility } from '@/server/actions/admin-intro.actions';

interface Props {
    initialVisible: boolean;
}

export default function IntroVisibilityIsland({ initialVisible }: Props) {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(initialVisible);
    const [isPending, startTransition] = useTransition();
    const { toast, showToast, hideToast } = useAdminToast();

    const handleToggle = () => {
        startTransition(async () => {
            try {
                const res = await toggleIntroVisibility();
                if (res.success) {
                    setIsVisible(res.show ?? false);
                    showToast(`Introductie is nu ${res.show ? 'zichtbaar' : 'verborgen'}`, 'success');
                    router.refresh();
                } else {
                    showToast(res.error || 'Bijwerken mislukt', 'error');
                }
            } catch (err) {
                showToast('Er is een onverwachte fout opgetreden', 'error');
            }
        });
    };

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
