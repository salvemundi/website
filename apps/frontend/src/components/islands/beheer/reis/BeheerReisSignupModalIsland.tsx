'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import type { Trip, TripSignup, TripActivity } from '@salvemundi/validations';
import { Users, Pen, Trash, X, Save, Loader2, Ticket } from 'lucide-react';
import ReisSignupForm from './ReisSignupForm';
import ReisSignupActivities from './ReisSignupActivities';
import ReisSignupView from './ReisSignupView';

interface AdminReisSignupModalIslandProps {
    isOpen: boolean;
    isEditing: boolean;
    isPending: boolean;
    selectedSignup: TripSignup | null;
    trip: Trip;
    allTripActivities: TripActivity[];
    selectedActivities: number[];
    sendingEmailTo: { signupId: number; type: string } | null;
    formRef: React.RefObject<HTMLFormElement | null>;
    onClose: () => void;
    onToggleEdit: () => void;
    onDelete: () => void;
    onSave: (formData: FormData) => void;
    onToggleActivity: (id: number) => void;
    onResendEmail: (signupId: number, type: 'deposit' | 'final') => void;
}

export default function BeheerReisSignupModalIsland({
    isOpen,
    isEditing,
    isPending,
    selectedSignup,
    trip,
    allTripActivities,
    selectedActivities,
    sendingEmailTo,
    formRef,
    onClose,
    onToggleEdit,
    onDelete,
    onSave,
    onToggleActivity,
    onResendEmail
}: AdminReisSignupModalIslandProps) {
    if (!isOpen || !selectedSignup) return null;

    return createPortal(
        <div className="modal-backdrop">
            <div
                className="modal-backdrop"
                onClick={onClose}
            />

            <div
                className="modal-content"
                style={{ maxWidth: isEditing ? '1200px' : '700px' }}
            >
                <div className="flex-between border-b bg-beheer-card-soft p-6">
                    <h2 className="flex items-center gap-3 text-beheer-text">
                        <div className="icon-box">
                            {isEditing ? <Pen className="size-4" /> : <Users className="size-4" />}
                        </div>
                        {isEditing ? 'Deelnemer Bewerken' : 'Deelnemer Details'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onDelete}
                            disabled={isPending}
                            title="Verwijder Deelnemer"
                            className="icon-button beheer-button-secondary text-theme-error"
                            type="button">
                            {isPending ? <Loader2 className="size-5 animate-spin" /> : <Trash className="size-5" />}
                        </button>
                        <div className="h-6 w-px bg-beheer-border/20" />
                        <button
                            onClick={onToggleEdit}
                            title={isEditing ? "Terug naar weergave" : "Bewerken"}
                            className="icon-button beheer-button-secondary"
                            type="button">
                            <Pen className="size-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="icon-button beheer-button-secondary"
                            type="button">
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {isEditing ? (
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                        <form ref={formRef} action={onSave} className="flex flex-col">
                            <input type="hidden" name="id" value={selectedSignup.id} />

                            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                                <div className="space-y-4">
                                    <ReisSignupForm
                                        signup={selectedSignup}
                                        isBusTrip={!!trip.is_bus_trip}
                                        minimal={true}
                                        section="personal_basic"
                                        cockpit={true}
                                    />
                                </div>

                                <div className="space-y-6">
                                    <ReisSignupForm
                                        signup={selectedSignup}
                                        isBusTrip={!!trip.is_bus_trip}
                                        minimal={true}
                                        section="personal_extended"
                                        cockpit={true}
                                    />
                                </div>

                                <div className="space-y-6">
                                    <ReisSignupForm
                                        signup={selectedSignup}
                                        isBusTrip={!!trip.is_bus_trip}
                                        minimal={true}
                                        section="admin"
                                        cockpit={true}
                                    />

                                    <div className="border-t border-beheer-border/10 pt-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <Ticket className="size-3 text-beheer-accent" />
                                            <h3 className="text-xs font-semibold text-beheer-text">Activiteiten</h3>
                                        </div>
                                        <ReisSignupActivities
                                            allActivities={allTripActivities}
                                            selectedActivities={selectedActivities}
                                            onToggleActivity={onToggleActivity}
                                            onUpdate={() => { }}
                                            isUpdating={false}
                                            hideButton={true}
                                            minimal={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                        <ReisSignupView signup={selectedSignup} isBusTrip={!!trip.is_bus_trip} />
                    </div>
                )}

                <div className="modal-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        className="beheer-button-secondary"
                    >
                        {isEditing ? 'Annuleren' : 'Sluiten'}
                    </button>

                    {isEditing ? (
                        <button
                            onClick={() => {
                                if (formRef.current) formRef.current.requestSubmit();
                            }}
                            disabled={isPending}
                            className="beheer-button"
                            type="button">
                            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                            <span>Gegevens Opslaan</span>
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => onResendEmail(selectedSignup.id, 'deposit')}
                                disabled={selectedSignup.deposit_paid || (sendingEmailTo?.signupId === selectedSignup.id && sendingEmailTo.type === 'deposit')}
                                className="form-button"
                            >
                                Aanbetaling Mail
                            </button>
                            <button
                                type="button"
                                onClick={() => onResendEmail(selectedSignup.id, 'final')}
                                disabled={selectedSignup.full_payment_paid || !trip.allow_final_payments || (sendingEmailTo?.signupId === selectedSignup.id && sendingEmailTo.type === 'final')}
                                className="form-button"
                            >
                                Restbetaling Mail
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}