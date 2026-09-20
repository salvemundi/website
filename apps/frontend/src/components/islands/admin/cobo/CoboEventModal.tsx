'use client';

import React, { useState, useTransition } from 'react';
import AdminModal from '@/components/ui/admin/AdminModal';
import { createCoboEventAction, updateCoboEventAction } from '@/server/actions/admin/cobo/admin-cobo-management.actions';
import { type CoboEvent } from '@salvemundi/validations';
import { Loader2, Calendar, MapPin, FileText, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    eventToEdit?: CoboEvent | null;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function CoboEventModal({
    isOpen,
    onClose,
    eventToEdit,
    showToast
}: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [title, setTitle] = useState(eventToEdit?.title || '');
    const [date, setDate] = useState(
        eventToEdit?.date ? new Date(eventToEdit.date).toISOString().slice(0, 16) : ''
    );
    const [location, setLocation] = useState(eventToEdit?.location || 'Borrelbar Eindhoven');
    const [description, setDescription] = useState(eventToEdit?.description || '');

    // Reset when modal opens with new eventToEdit
    React.useEffect(() => {
        if (eventToEdit) {
            setTitle(eventToEdit.title || '');
            setDate(eventToEdit.date ? new Date(eventToEdit.date).toISOString().slice(0, 16) : '');
            setLocation(eventToEdit.location || 'Borrelbar Eindhoven');
            setDescription(eventToEdit.description || '');
        } else {
            setTitle('');
            setDate('');
            setLocation('Borrelbar Eindhoven');
            setDescription('');
        }
    }, [eventToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            showToast('Vul een titel/jaar in voor de CoBo', 'error');
            return;
        }

        startTransition(async () => {
            if (eventToEdit) {
                const res = await updateCoboEventAction(eventToEdit.id, {
                    title: title.trim(),
                    date: date || undefined,
                    location: location.trim(),
                    description: description.trim()
                });

                if (res.success) {
                    showToast('CoBo evenement succesvol bijgewerkt', 'success');
                    onClose();
                    router.refresh();
                } else {
                    showToast(res.error || 'Bijwerken mislukt', 'error');
                }
            } else {
                const res = await createCoboEventAction({
                    title: title.trim(),
                    date: date || undefined,
                    location: location.trim(),
                    description: description.trim()
                });

                if (res.success) {
                    showToast('Nieuwe CoBo succesvol aangemaakt', 'success');
                    onClose();
                    document.cookie = `cobo_admin_selected_id=${res.event.id}; path=/; max-age=31536000; SameSite=Lax`;
                    router.refresh();
                } else {
                    showToast(res.error || 'Aanmaken mislukt', 'error');
                }
            }
        });
    };

    return (
        <AdminModal
            isOpen={isOpen}
            onClose={onClose}
            title={eventToEdit ? `CoBo Bewerken: ${eventToEdit.title ?? ''}` : 'Nieuwe CoBo Aanmaken'}
            subtitle={eventToEdit ? 'Pas de algemene gegevens en teksten aan' : 'Maak een nieuwe CoBo editie aan voor het komende bestuursjaar'}
            maxWidth="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400 shrink-0" />
                        <span>Titel / Bestuursjaar *</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Bijv. CoBo 2026 of CoBo Bestuur VIII"
                        required
                        className="beheer-input w-full px-4 py-3 bg-bg-soft rounded-xl border border-border-color focus:border-theme-purple focus:outline-none text-sm text-text-main font-medium"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-500 dark:text-purple-400 shrink-0" />
                            <span>Datum &amp; Aanvangstijd</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="beheer-input w-full px-4 py-3 bg-bg-soft rounded-xl border border-border-color focus:border-theme-purple focus:outline-none text-sm text-text-main font-medium"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-purple-500 dark:text-purple-400 shrink-0" />
                            <span>Locatie</span>
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Bijv. Borrelbar Eindhoven"
                            className="beheer-input w-full px-4 py-3 bg-bg-soft rounded-xl border border-border-color focus:border-theme-purple focus:outline-none text-sm text-text-main font-medium"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-500 dark:text-purple-400 shrink-0" />
                        <span>Algemene Informatie / Uitnodigingstekst</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Toelichting of welkomstboodschap voor de bezoekende besturen..."
                        className="beheer-input w-full px-4 py-3 bg-bg-soft rounded-xl border border-border-color focus:border-theme-purple focus:outline-none text-sm text-text-main font-medium resize-none"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-color/60">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="beheer-button px-5 py-2.5 rounded-xl border border-border-color text-text-muted text-sm font-semibold hover:bg-bg-soft transition-colors cursor-pointer"
                    >
                        Annuleren
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="beheer-button px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {eventToEdit ? 'Wijzigingen Opslaan' : 'CoBo Aanmaken'}
                    </button>
                </div>
            </form>
        </AdminModal>
    );
}
