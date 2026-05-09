'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Trip, TripSignup, TripActivity } from '@salvemundi/validations/schema/admin-reis.zod';
import { Users, Edit2, Trash2, X, Save, Loader2, Ticket } from 'lucide-react';
import SignupForm from './SignupForm';
import SignupActivities from './SignupActivities';
import SignupView from './SignupView';

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
        <AnimatePresence>
            <div className="fixed inset-0 z-[100000] flex items-start justify-center p-4 sm:p-6 overflow-y-auto isolate custom-scrollbar">
                {/* Background Overlay */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl" 
                    onClick={onClose} 
                />
                
                {/* Modal Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        maxWidth: isEditing ? '1200px' : '700px' 
                    }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    className="bg-[var(--beheer-card-bg)] w-full rounded-[2.5rem] shadow-[var(--shadow-card-elevated)] ring-1 ring-white/10 flex flex-col relative z-10 border border-[var(--beheer-border)] my-auto max-h-[90vh]"
                >
                    {/* Header with subtle glow */}
                    <div className="px-8 py-6 border-b border-[var(--beheer-border)] flex justify-between items-center bg-[var(--beheer-card-soft)]/80 relative shrink-0">
                        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[var(--beheer-accent)]/30 to-transparent" />
                        <h2 className="text-[10px] font-semibold text-[var(--beheer-text)] flex items-center gap-3">
                            <div className="bg-[var(--beheer-accent)] text-white p-2.5 rounded-2xl shadow-[var(--shadow-glow)]">
                                {isEditing ? <Edit2 className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                            </div>
                            {isEditing ? 'Deelnemer Bewerken' : 'Deelnemer Details'}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={onDelete}
                                disabled={isPending}
                                title="Verwijder Deelnemer"
                                className="p-2.5 rounded-full transition-all active:scale-90 focus:outline-none border text-red-500/60 hover:text-red-500 border-transparent hover:border-red-500/20 hover:bg-red-500/5"
                            >
                                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                            </button>
                            <div className="w-px h-6 bg-[var(--beheer-border)]/20 mx-1" />
                            <button 
                                onClick={onToggleEdit}
                                title={isEditing ? "Terug naar weergave" : "Bewerken"}
                                className={`p-2.5 rounded-full transition-all active:scale-90 focus:outline-none border ${isEditing ? 'bg-[var(--beheer-accent)] text-white border-[var(--beheer-accent)] shadow-glow' : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] border-transparent hover:border-[var(--beheer-border)]'}`}
                            >
                                <Edit2 className="h-5 w-5" />
                            </button>
                            <button 
                                onClick={onClose} 
                                className="text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-bg)] p-2.5 rounded-full transition-all active:scale-90 focus:outline-none border border-transparent hover:border-[var(--beheer-border)]"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <form ref={formRef} action={onSave} className="flex flex-col h-full">
                                <input type="hidden" name="id" value={selectedSignup.id} />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 xl:gap-12 items-start">
                                    <div className="space-y-4">
                                        <SignupForm 
                                            signup={selectedSignup} 
                                            isBusTrip={!!trip?.is_bus_trip}
                                            minimal={true}
                                            section="personal_basic"
                                            cockpit={true}
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <SignupForm 
                                            signup={selectedSignup} 
                                            isBusTrip={!!trip?.is_bus_trip}
                                            minimal={true}
                                            section="personal_extended"
                                            cockpit={true}
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <SignupForm 
                                            signup={selectedSignup} 
                                            isBusTrip={!!trip?.is_bus_trip}
                                            minimal={true}
                                            section="admin"
                                            cockpit={true}
                                        />
                                        
                                        <div className="pt-4 border-t border-[var(--beheer-border)]/10">
                                            <div className="flex items-center gap-2 mb-3 opacity-50">
                                                <Ticket className="h-3 w-3 text-[var(--beheer-accent)]" />
                                                <h3 className="text-[10px] font-semibold text-[var(--beheer-text)]">Activiteiten</h3>
                                            </div>
                                            <SignupActivities 
                                                allActivities={allTripActivities}
                                                selectedActivities={selectedActivities}
                                                onToggleActivity={onToggleActivity}
                                                onUpdate={() => {}} 
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
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <SignupView signup={selectedSignup} isBusTrip={!!trip?.is_bus_trip} />
                        </div>
                    )}

                    {/* Action Footer */}
                    <div className="px-8 py-5 border-t border-[var(--beheer-border)]/10 bg-[var(--beheer-card-soft)]/90 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 rounded-b-[2.5rem]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-[10px] font-semibold text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] transition-colors"
                        >
                            {isEditing ? 'Annuleren' : 'Sluiten'}
                        </button>
                        
                        {isEditing ? (
                            <button
                                onClick={() => {
                                    if (formRef.current) formRef.current.requestSubmit();
                                }}
                                disabled={isPending}
                                className="px-10 py-3 bg-[var(--beheer-accent)] text-white rounded-2xl font-semibold text-[10px] shadow-lg shadow-[var(--beheer-accent)]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                <span>Gegevens Opslaan</span>
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => onResendEmail(selectedSignup.id, 'deposit')}
                                    disabled={selectedSignup.deposit_paid || (sendingEmailTo?.signupId === selectedSignup.id && sendingEmailTo.type === 'deposit')}
                                    className={`px-5 py-2.5 rounded-xl text-[9px] font-semibold border transition-all ${selectedSignup.deposit_email_sent ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-[var(--beheer-accent)] text-white border-white/10 shadow-lg shadow-[var(--beheer-accent)]/20 hover:scale-[1.02]'} disabled:opacity-30 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed`}
                                >
                                    Aanbetaling Mail
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onResendEmail(selectedSignup.id, 'final')}
                                    disabled={selectedSignup.full_payment_paid || !trip?.allow_final_payments || (sendingEmailTo?.signupId === selectedSignup.id && sendingEmailTo.type === 'final')}
                                    className={`px-5 py-2.5 rounded-xl text-[9px] font-semibold border transition-all ${selectedSignup.final_email_sent ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-emerald-500 text-white border-white/10 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] disabled:opacity-30 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed'}`}
                                >
                                    Restbetaling Mail
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
