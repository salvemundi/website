'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { toggleIntroStudentSignups } from '@/server/actions/admin/intro/admin-intro-core.actions';

interface Props {
    initialOpen: boolean;
}

export default function IntroStudentSignupToggleIsland({ initialOpen }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [isPending, startTransition] = useTransition();
    const { toast, showToast, hideToast } = useAdminToast();

    const handleToggle = () => {
        startTransition(async () => {
            try {
                const res = await toggleIntroStudentSignups();
                if (res.success) {
                    setIsOpen(res.open ?? false);
                    showToast(`Inschrijvingen voor intro leden zijn nu ${res.open ? 'geopend' : 'gesloten'}`, 'success');
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
                isVisible={isOpen}
                onToggle={handleToggle}
                isPending={isPending}
                label="Inschrijving Leden"
            />
            {toast && <AdminToast toast={toast} onClose={hideToast} />}
        </>
    );
}
