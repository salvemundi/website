'use client';

import React, { useState, useTransition } from 'react';
import BeheerModal from '@/components/ui/beheer/BeheerModal';
import { createCoboEventAction, updateCoboEventAction } from '@/server/actions/beheer/cobo/beheer-cobo-management.actions';
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

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
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
        <BeheerModal
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
                        className="form-label-uppercase"
                    >
                        <Sparkles className="size-4 shrink-0 text-theme-purple" />
                        <span>Titel / Bestuursjaar *</span>
                    </label>
                    <input
                        id="cobo-title"
                        name="title"
                        type="text"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Bijv. CoBo 2026 of CoBo Bestuur VIII"
                        required
                        className="form-input"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <label
                            htmlFor="cobo-date"
                            className="form-label-uppercase"
                        >
                            <Calendar className="size-4 shrink-0 text-theme-purple" />
                            <span>Datum &amp; Aanvangstijd</span>
                        </label>
                        <input
                            id="cobo-date"
                            name="date"
                            type="datetime-local"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                            className="form-input"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="cobo-location"
                            className="form-label-uppercase"
                        >
                            <MapPin className="size-4 shrink-0 text-theme-purple" />
                            <span>Locatie</span>
                        </label>
                        <input
                            id="cobo-location"
                            name="location"
                            type="text"
                            value={location}
                            onChange={(event) => setLocation(event.target.value)}
                            placeholder="Bijv. Borrelbar Eindhoven"
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="cobo-description"
                        className="form-label-uppercase"
                    >
                        <FileText className="size-4 shrink-0 text-theme-purple" />
                        <span>Algemene Informatie / Uitnodigingstekst</span>
                    </label>
                    <textarea
                        id="cobo-description"
                        name="description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={4}
                        placeholder="Toelichting of welkomstboodschap voor de bezoekende besturen..."
                        className="form-input resize-y"
                    />
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="btn-secondary"
                    >
                        Annuleren
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="form-button"
                    >
                        {isPending && <Loader2 className="size-4 animate-spin" />}
                        <span>{eventToEdit ? 'Wijzigingen Opslaan' : 'CoBo Aanmaken'}</span>
                    </button>
                </div>
            </form>
        </BeheerModal>
    );
}
