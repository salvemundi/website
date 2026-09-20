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
import { useAdminToast } from '@/hooks/use-admin-toast';
import AdminToast from '@/components/ui/admin/AdminToast';
import { Users, Shield, Calendar, MapPin, Sparkles } from 'lucide-react';
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

    // Als er geen actieve CoBo is aangemaakt
    if (!activeEvent) {
        return (
            <div className="py-16 max-w-xl mx-auto text-center space-y-6">
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-text-main">Nog geen CoBo evenement aangemaakt</h2>
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
                    className="beheer-button px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-sm shadow-xl hover:shadow-purple-500/25 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
                >
                    <Sparkles className="h-5 w-5" />
                    <span>Eerste CoBo Aanmaken</span>
                </button>

                <CoboEventModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    eventToEdit={eventToEdit}
                    showToast={showToast}
                />
                {toast && <AdminToast toast={toast} onClose={hideToast} />}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header info badge card */}
            <div className="bg-bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-border-color shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black text-text-main truncate">
                            {activeEvent.title || 'CoBo'}
                        </h2>
                        <div className="flex items-center gap-4 mt-1 text-xs text-text-muted font-medium flex-wrap">
                            {activeEvent.date && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-purple-500" />
                                    {formatDate(activeEvent.date)}
                                </span>
                            )}
                            {activeEvent.location && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-purple-500" />
                                    {activeEvent.location}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hoofdtab selector */}
                <div className="flex items-center gap-2 p-1.5 bg-bg-soft rounded-2xl border border-border-color/60 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={() => handleTabChange('queue')}
                        className={`tab-button flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            activeTab === 'queue'
                                ? 'bg-bg-card text-purple-600 dark:text-purple-300 shadow-sm border border-purple-500/20'
                                : 'text-text-muted hover:text-text-main'
                        }`}
                    >
                        <Users className="h-4 w-4" />
                        <span>Gasten Wachtlijst</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('preferences')}
                        className={`tab-button flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            activeTab === 'preferences'
                                ? 'bg-bg-card text-purple-600 dark:text-purple-300 shadow-sm border border-purple-500/20'
                                : 'text-text-muted hover:text-text-main'
                        }`}
                    >
                        <Shield className="h-4 w-4" />
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

            {toast && <AdminToast toast={toast} onClose={hideToast} />}
        </div>
    );
}
