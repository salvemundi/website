'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { toggleIntroAttendanceVisibility } from '@/server/actions/admin/intro/admin-intro-core.actions';

interface Props {
    initialVisible: boolean;
}

export default function IntroAttendanceVisibilityIsland({ initialVisible }: Props) {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(initialVisible);
    const [isPending, startTransition] = useTransition();
    const { toast, showToast, hideToast } = useAdminToast();

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
        <>
            <AdminVisibilityToggle
                isVisible={isVisible}
                onToggle={handleToggle}
                isPending={isPending}
                label="Aanwezigheid zichtbaar"
            />
            {toast && <AdminToast toast={toast} onClose={hideToast} />}
        </>
    );
}
