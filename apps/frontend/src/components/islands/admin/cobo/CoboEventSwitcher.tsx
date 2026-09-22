'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSelect from '@/components/ui/admin/AdminSelect';
import { type CoboEvent } from '@salvemundi/validations';
import { Plus, Settings2 } from 'lucide-react';
import CoboEventModal from './CoboEventModal';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface Props {
    events: CoboEvent[];
    activeEvent: CoboEvent | null;
}

export default function CoboEventSwitcher({
    events,
    activeEvent
}: Props) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CoboEvent | null>(null);
    const { toast, showToast, hideToast } = useAdminToast();

    const handleSwitch = (newId: number) => {
        document.cookie = `cobo_admin_selected_id=${newId}; path=/; max-age=31536000; SameSite=Lax`;
        router.refresh();
    };

    const handleEdit = () => {
        setEventToEdit(activeEvent);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setEventToEdit(null);
        setIsModalOpen(true);
    };

    const options = events.map(e => ({
        value: e.id,
        label: e.title || `CoBo #${e.id}`
    }));

    return (
        <>
            <div className="flex items-center gap-2 flex-wrap">
                {options.length > 0 && activeEvent && (
                    <div className="w-full sm:w-auto m:min-w-50">
                        <AdminSelect
                            value={activeEvent.id}
                            onChange={handleSwitch}
                            options={options}
                            size="sm"
                        />
                    </div>
                )}

                {activeEvent && (
                    <button
                        type="button"
                        onClick={handleEdit}
                        title="CoBo Instellingen & Tekst bewerken"
                        className="beheer-button flex items-center justify-center gap-1.5 px-3 py-2 bg-bg-card border border-border-color text-text-main rounded-xl text-xs font-semibold hover:border-theme-purple hover:bg-theme-purple/5 transition-all shadow-sm cursor-pointer"
                    >
                        <Settings2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Bewerken</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={handleNew}
                    title="Nieuwe CoBo editie aanmaken"
                    className="beheer-button flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Nieuw</span>
                </button>
            </div>

            <CoboEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventToEdit={eventToEdit}
                showToast={showToast}
            />

            {toast && <AdminToast toast={toast} onClose={hideToast} />}
        </>
    );
}
