'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import BeheerVisibilityToggle from '@/components/ui/beheer/BeheerVisibilityToggle';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { toggleIntroStudentSignups } from '@/server/actions/beheer/intro/beheer-intro-core.actions';

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
            <BeheerVisibilityToggle
                isVisible={isOpen}
                onToggle={handleToggle}
                isPending={isPending}
                label="Inschrijving Leden"
            />
            {toast && <BeheerToast toast={toast} onClose={hideToast} />}
        </>
    );
}
