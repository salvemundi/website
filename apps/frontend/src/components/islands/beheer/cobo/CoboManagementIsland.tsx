'use client';

import React, { useState } from 'react';
import {
    type CoboEvent,
    type CoboBoardPreference,
    type CoboGuestBoard
} from '@salvemundi/validations';
import CoboQueueManager from './CoboQueueManager';
import CoboBoardPreferencesManager from './CoboBoardPreferencesManager';
import CoboEventModal from './CoboEventModal';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { Users, Shield, Calendar, MapPin, Plus } from 'lucide-react';
import { formatDate } from '@/shared/lib/utils/date';

interface Props {
    events?: CoboEvent[];
    activeEvent: CoboEvent | null;
    initialPreferences: CoboBoardPreference[];
    initialGuestBoards: CoboGuestBoard[];
    initialTab?: 'queue' | 'preferences';
    initialQueueSubtab?: 'queue' | 'completed' | 'late';
}

export default function CoboManagementIsland({
    activeEvent,
    initialPreferences,
    initialGuestBoards,
    initialTab = 'queue',
    initialQueueSubtab = 'queue'
}: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [activeTab, setActiveTab] = useState<'queue' | 'preferences'>(initialTab);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CoboEvent | null>(null);

    const handleTabChange = (tab: 'queue' | 'preferences') => {
        setActiveTab(tab);
        try {
            document.cookie = `cobo_admin_tab=${tab}; path=/; max-age=31536000; SameSite=Lax`;
            localStorage.setItem('sm_admin_cobo_tab', tab);
        } catch {
            // Ignore storage errors
        }
    };

    if (!activeEvent) {
        return (
            <div className="container-centered-hero">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-text-main">Nog geen CoBo evenement aangemaakt</h2>
                    <p className="text-sm text-text-muted">
                        Maak een CoBo evenement aan om te starten met bestuursvoorkeuren en de gasten-wachtlijst.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setEventToEdit(null);
                        setIsModalOpen(true);
                    }}
                    className="beheer-button"
                >
                    <Plus className="size-4" />
                    <span>Eerste CoBo Aanmaken</span>
                </button>

                <CoboEventModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    eventToEdit={eventToEdit}
                    showToast={showToast}
                />
                {toast && <BeheerToast toast={toast} onClose={hideToast} />}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="card-header-responsive">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-text-main sm:text-xl">
                            {activeEvent.title || 'CoBo'}
                        </h2>
                        <div className="filter-tab-button">
                            {activeEvent.date && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="size-3.5 text-theme-purple" />
                                    {formatDate(activeEvent.date, 'd MMMM yyyy HH:mm')}
                                </span>
                            )}
                            {activeEvent.location && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="size-3.5 text-theme-purple" />
                                    {activeEvent.location}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="tab-strip-responsive">
                    <button
                        type="button"
                        onClick={() => handleTabChange('queue')}
                        className={`tab-button-responsive ${
                            activeTab === 'queue'
                                ? 'border border-border-color bg-bg-card text-theme-purple shadow-xs'
                                : 'text-text-muted hover:text-text-main'
                        }`}
                    >
                        <Users className="size-3.5" />
                        <span>Gasten Wachtlijst</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('preferences')}
                        className={`tab-button-responsive ${
                            activeTab === 'preferences'
                                ? 'border border-border-color bg-bg-card text-theme-purple shadow-xs'
                                : 'text-text-muted hover:text-text-main'
                        }`}
                    >
                        <Shield className="size-3.5" />
                        <span>Bestuursvoorkeuren &amp; Veto&apos;s</span>
                    </button>
                </div>
            </div>

            {/* Tab inhoud */}
            {activeTab === 'queue' ? (
                <CoboQueueManager
                    coboId={activeEvent.id}
                    initialBoards={initialGuestBoards}
                    initialTab={initialQueueSubtab}
                    showToast={showToast}
                />
            ) : (
                <CoboBoardPreferencesManager
                    coboId={activeEvent.id}
                    initialPreferences={initialPreferences}
                    showToast={showToast}
                />
            )}

            {/* Edit / New Modal */}
            <CoboEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventToEdit={eventToEdit}
                showToast={showToast}
            />

            {toast && <BeheerToast toast={toast} onClose={hideToast} />}
        </div>
    );
}
