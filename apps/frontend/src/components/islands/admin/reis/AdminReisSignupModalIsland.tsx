'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import type { Trip, TripSignup, TripActivity } from '@salvemundi/validations/schema/admin-trip.zod';
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

export default function AdminReisSignupModalIsland({
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
        <div className="custom-scrollbar animate-in fade-in fixed inset-0 isolate z-100000 flex items-start justify-center overflow-y-auto p-4 duration-300 sm:p-6">
            <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl"
                onClick={onClose}
            />

            <div
                className="animate-in fade-in zoom-in-[0.98] slide-in-from-bottom-4 relative z-10 my-auto flex max-h-[90vh] w-full flex-col rounded-[2.5rem] border border-(--beheer-border) bg-(--beheer-card-bg) shadow-(--shadow-card-elevated) ring-1 ring-white/10 duration-300 ease-out"
                style={{ maxWidth: isEditing ? '1200px' : '700px' }}
            >
                <div className="relative flex shrink-0 items-center justify-between border-b border-(--beheer-border) bg-(--beheer-card-soft)/80 px-8 py-6">
                    <div className="absolute inset-x-0 -bottom-px h-px bg-linear-to-r from-transparent via-(--beheer-accent)/30 to-transparent" />
                    <h2 className="flex items-center gap-3 text-[10px] font-semibold text-(--beheer-text)">
                        <div className="rounded-2xl bg-(--beheer-accent) p-2.5 text-white shadow-(--shadow-glow)">
                            {isEditing ? <Pen className="size-4" /> : <Users className="size-4" />}
                        </div>
                        {isEditing ? 'Deelnemer Bewerken' : 'Deelnemer Details'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onDelete}
                            disabled={isPending}
                            title="Verwijder Deelnemer"
                            className="icon-button rounded-full border border-transparent p-2.5 text-red-500/60 transition-all hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-500 focus:outline-none active:scale-90"
                        >
                            {isPending ? <Loader2 className="size-5 animate-spin" /> : <Trash className="size-5" />}
                        </button>
                        <div className="mx-1 h-6 w-px bg-(--beheer-border)/20" />
                        <button
                            onClick={onToggleEdit}
                            title={isEditing ? "Terug naar weergave" : "Bewerken"}
                            className={`icon-button rounded-full border p-2.5 transition-all focus:outline-none active:scale-90 ${isEditing ? 'border-(--beheer-accent) bg-(--beheer-accent) text-white shadow-glow' : 'border-transparent text-(--beheer-text-muted) hover:border-(--beheer-border) hover:text-(--beheer-accent)'}`}
                        >
                            <Pen className="size-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="icon-button rounded-full border border-transparent p-2.5 text-(--beheer-text-muted) transition-all hover:border-(--beheer-border) hover:bg-(--beheer-card-bg) hover:text-(--beheer-text) focus:outline-none active:scale-90"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {isEditing ? (
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                        <form ref={formRef} action={onSave} className="flex h-full flex-col">
                            <input type="hidden" name="id" value={selectedSignup.id} />

                            <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 xl:grid-cols-3 xl:gap-12">
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

                                    <div className="border-t border-(--beheer-border)/10 pt-4">
                                        <div className="mb-3 flex items-center gap-2 opacity-50">
                                            <Ticket className="size-3 text-(--beheer-accent)" />
                                            <h3 className="text-[10px] font-semibold text-(--beheer-text)">Activiteiten</h3>
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

                <div className="flex shrink-0 items-center justify-between gap-4 rounded-b-[2.5rem] border-t border-(--beheer-border)/10 bg-(--beheer-card-soft)/90 px-8 py-5 backdrop-blur-md">
                    <button
                        type="button"
                        onClick={onClose}
                        className="beheer-button px-6 py-2.5 text-[10px] font-semibold text-(--beheer-text-muted) transition-colors hover:text-(--beheer-text)"
                    >
                        {isEditing ? 'Annuleren' : 'Sluiten'}
                    </button>

                    {isEditing ? (
                        <button
                            onClick={() => {
                                if (formRef.current) formRef.current.requestSubmit();
                            }}
                            disabled={isPending}
                            className="hover:scale-1.02 beheer-button flex items-center gap-3 rounded-2xl bg-(--beheer-accent) px-10 py-3 text-[10px] font-semibold text-white shadow-(--beheer-accent)/20 shadow-lg transition-all active:scale-95"
                        >
                            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                            <span>Gegevens Opslaan</span>
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => onResendEmail(selectedSignup.id, 'deposit')}
                                disabled={selectedSignup.deposit_paid || (sendingEmailTo?.signupId === selectedSignup.id && sendingEmailTo.type === 'deposit')}
                                className={`beheer-button rounded-xl border px-5 py-2.5 text-[9px] font-semibold transition-all ${selectedSignup.deposit_email_sent ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'hover:scale-1.02 border-white/10 bg-(--beheer-accent) text-white shadow-(--beheer-accent)/20 shadow-lg'} disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:grayscale`}
                            >
                                Aanbetaling Mail
                            </button>
                            <button
                                type="button"
                                onClick={() => onResendEmail(selectedSignup.id, 'final')}
                                disabled={selectedSignup.full_payment_paid || !trip.allow_final_payments || (sendingEmailTo?.signupId === selectedSignup.id && sendingEmailTo.type === 'final')}
                                className={`beheer-button rounded-xl border px-5 py-2.5 text-[9px] font-semibold transition-all ${selectedSignup.final_email_sent ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'hover:scale-1.02 border-white/10 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:grayscale'}`}
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