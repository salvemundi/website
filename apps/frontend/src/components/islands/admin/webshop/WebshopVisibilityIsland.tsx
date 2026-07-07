'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { toggleWebshopVisibility } from '@/server/actions/admin/webshop/admin-webshop-settings.actions';

interface WebshopVisibilityIslandProps {
    initialVisible: boolean;
}

const WebshopVisibilityIsland: React.FC<WebshopVisibilityIslandProps> = ({ initialVisible }) => {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(initialVisible);
    const [isPending, startTransition] = useTransition();
    const { toast, showToast, hideToast } = useAdminToast();

    const handleToggle = () => {
        startTransition(async () => {
            try {
                const res = await toggleWebshopVisibility();
                if (res.success && typeof res.show === 'boolean') {
                    setIsVisible(res.show);
                    showToast(`Webshop is nu ${res.show ? 'zichtbaar' : 'verborgen'}`, 'success');
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
            />
            {toast && <AdminToast toast={toast} onClose={hideToast} />}
        </>
    );
};

export default WebshopVisibilityIsland;