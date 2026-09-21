'use client';

import React, { useState, useTransition } from 'react';
import AdminModal from '@/components/ui/admin/AdminModal';
import { createCoboEventAction, updateCoboEventAction } from '@/server/actions/admin/cobo/admin-cobo-management.actions';
import { type CoboEvent } from '@salvemundi/validations';
import { Loader2, Calendar, MapPin, FileText, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toLocalInputValue } from '@/shared/lib/utils/date';

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
    const [date, setDate] = useState(toLocalInputValue(eventToEdit?.date));
    const [location, setLocation] = useState(eventToEdit?.location || 'Borrelbar Eindhoven');
    const [description, setDescription] = useState(eventToEdit?.description || '');

    // Reset when modal opens with new eventToEdit
    React.useEffect(() => {
        if (eventToEdit) {
            setTitle(eventToEdit.title || '');
            setDate(toLocalInputValue(eventToEdit.date));
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
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            showToast('Vul een titel/jaar in voor de CoBo', 'error');
            return;
        }

        const isoDate = date ? new Date(date).toISOString() : undefined;

        startTransition(async () => {
            if (eventToEdit) {
                const res = await updateCoboEventAction(eventToEdit.id, {
                    title: trimmedTitle,
                    date: isoDate,
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
                    title: trimmedTitle,
                    date: isoDate,
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
            <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isPending}>
                <div className="space-y-2">
                    <label
                        htmlFor="cobo-title"
                        className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2"
                    >
                        <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400 shrink-0" />
                        <span>Titel / Bestuursjaar *</span>
                    </label>
                    <input
                        id="cobo-title"
                        name="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Bijv. CoBo 2026 of CoBo Bestuur VIII"
                        required
                        className="beheer-input w-full min-h-11 px-4 py-2.5 bg-bg-soft rounded-xl border border-border-color focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-sm text-text-main font-medium transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label
                            htmlFor="cobo-date"
                            className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2"
                        >
                            <Calendar className="h-4 w-4 text-purple-500 dark:text-purple-400 shrink-0" />
                            <span>Datum &amp; Aanvangstijd</span>
                        </label>
                        <input
                            id="cobo-date"
                            name="date"
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="beheer-input w-full min-h-11 px-4 py-2.5 bg-bg-soft rounded-xl border border-border-color focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-sm text-text-main font-medium transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="cobo-location"
                            className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2"
                        >
                            <MapPin className="h-4 w-4 text-purple-500 dark:text-purple-400 shrink-0" />
                            <span>Locatie</span>
                        </label>
                        <input
                            id="cobo-location"
                            name="location"
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Bijv. Borrelbar Eindhoven"
                            className="beheer-input w-full min-h-11 px-4 py-2.5 bg-bg-soft rounded-xl border border-border-color focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-sm text-text-main font-medium transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="cobo-description"
                        className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2"
                    >
                        <FileText className="h-4 w-4 text-purple-500 dark:text-purple-400 shrink-0" />
                        <span>Algemene Informatie / Uitnodigingstekst</span>
                    </label>
                    <textarea
                        id="cobo-description"
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Toelichting of welkomstboodschap voor de bezoekende besturen..."
                        className="beheer-input w-full min-h-24 px-4 py-3 bg-bg-soft rounded-xl border border-border-color focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-sm text-text-main font-medium resize-y transition-all"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-color/60">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="beheer-button min-h-11 px-5 py-2.5 rounded-xl border border-border-color text-text-muted text-sm font-semibold hover:bg-bg-soft hover:text-text-main transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Annuleren
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="beheer-button min-h-11 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>{eventToEdit ? 'Wijzigingen Opslaan' : 'CoBo Aanmaken'}</span>
                    </button>
                </div>
            </form>
        </AdminModal>
    );
}
