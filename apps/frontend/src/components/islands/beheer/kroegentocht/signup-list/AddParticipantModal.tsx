'use client';

import { useState } from 'react';
import { RefreshCw, UserPlus, X } from 'lucide-react';
import { PUB_CRAWL_ASSOCIATIONS } from '@salvemundi/validations/schema/pub-crawl.zod';

interface AddParticipantModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupNames: string[];
    onAdd: (data: {
        name: string;
        email: string;
        association: string;
        initial: string;
        group_name: string | null;
    }) => Promise<void>;
}

export default function AddParticipantModal({
    isOpen,
    onClose,
    groupNames,
    onAdd
}: AddParticipantModalProps) {
    const [name, setName] = useState('');
    const [initial, setInitial] = useState('');
    const [email, setEmail] = useState('');
    const [association, setAssociation] = useState('');
    const [customAssociation, setCustomAssociation] = useState('');
    const [groupName, setGroupName] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!name.trim()) {
            setErrorMessage('Naam is verplicht');
            return;
        }

        const finalAssociation = association === 'Anders' ? customAssociation : association;

        setIsSubmitting(true);
        try {
            await onAdd({
                name: name.trim(),
                email: email.trim(),
                association: finalAssociation.trim(),
                initial: initial.trim(),
                group_name: groupName || null
            });
            // Reset form
            setName('');
            setInitial('');
            setEmail('');
            setAssociation('');
            setCustomAssociation('');
            setGroupName('');
            onClose();
        } catch (error: unknown) {
            const err = error instanceof Error ? error.message : String(error);
            setErrorMessage(err || 'Fout bij toevoegen van deelnemer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm duration-200">
            <div className="animate-in fade-in zoom-in-95 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-(--beheer-border) bg-(--beheer-card-bg) shadow-2xl duration-150">
                <div className="flex items-center justify-between border-b border-(--beheer-border) p-6">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-(--beheer-text)">
                            <UserPlus className="size-5 text-(--beheer-accent)" />
                            Deelnemer Handmatig Toevoegen
                        </h2>
                        <p className="mt-1 text-xs text-(--beheer-text-muted)">
                            Voeg direct een deelnemer toe aan de kroegentocht.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="icon-button cursor-pointer rounded-lg p-2 text-(--beheer-text-muted) transition-colors hover:bg-(--beheer-card-soft) hover:text-(--beheer-text)"
                        type="button">
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-1 flex-col overflow-y-auto">
                    <div className="space-y-4 p-6">
                        {errorMessage && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-500">
                                {errorMessage}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-(--beheer-text)">
                                    Voornaam + tussenvoegsel <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="bijv. Jan van"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="beheer-input w-full"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-(--beheer-text)">
                                    1e letter achtern. <span className="text-[10px] font-normal text-(--beheer-text-muted)">(optioneel)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="bijv. S"
                                    maxLength={5}
                                    value={initial}
                                    onChange={(e) => setInitial(e.target.value)}
                                    className="beheer-input w-full"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-(--beheer-text)">
                                E-mailadres <span className="text-[10px] font-normal text-(--beheer-text-muted)">(optioneel)</span>
                            </label>
                            <input
                                type="email"
                                placeholder="jan@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="beheer-input w-full"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-(--beheer-text)">
                                Vereniging <span className="text-[10px] font-normal text-(--beheer-text-muted)">(optioneel)</span>
                            </label>
                            <select
                                value={association}
                                onChange={(e) => setAssociation(e.target.value)}
                                className="beheer-select w-full"
                            >
                                <option value="">Selecteer vereniging...</option>
                                {PUB_CRAWL_ASSOCIATIONS.map((assoc: string) => (
                                    <option key={assoc} value={assoc}>
                                        {assoc}
                                    </option>
                                ))}
                            </select>

                            {association === 'Anders' && (
                                <div className="animate-in fade-in slide-in-from-top-1 mt-2 duration-150">
                                    <input
                                        type="text"
                                        placeholder="Vul vereniging in..."
                                        value={customAssociation}
                                        onChange={(e) => setCustomAssociation(e.target.value)}
                                        className="beheer-input w-full"
                                    />
                                </div>
                            )}
                        </div>

                        {groupNames.length > 0 && (
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-(--beheer-text)">
                                    Groepsindeling <span className="text-[10px] font-normal text-(--beheer-text-muted)">(optioneel)</span>
                                </label>
                                <select
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="beheer-select w-full"
                                >
                                    <option value="">Niet ingedeeld</option>
                                    {groupNames.map((g) => (
                                        <option key={g} value={g}>
                                            {g}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-(--beheer-border) bg-(--beheer-card-soft)/40 p-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="beheer-button cursor-pointer rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-6 py-2.5 text-xs font-semibold text-(--beheer-text-muted) transition-all hover:bg-(--beheer-card-soft) hover:text-(--beheer-text) active:scale-95 disabled:opacity-50"
                        >
                            Annuleren
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="beheer-button flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--beheer-accent) px-6 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting && <RefreshCw className="size-4 animate-spin" />}
                            Deelnemer Toevoegen
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
