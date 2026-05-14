import { useState } from 'react';
import type { Trip, TripSignup } from '@salvemundi/validations/schema/admin-reis.zod';
import { updateSignupStatus, deleteTripSignup } from '@/server/actions/admin/reis-signups.actions';
import { sendPaymentEmail } from '@/server/actions/admin/reis-mail.actions';

import { type ToastType } from '@/components/ui/admin/AdminToast';

/**
 * Hook voor het beheren van reisaanmelding acties (status wijzigen, verwijderen, emails sturen).
 */
export function useReisActions(
    initialSignups: TripSignup[],
    trip: Trip,
    showToast: (message: string, type: ToastType) => void
) {
    const [signups, setSignups] = useState<TripSignup[]>(initialSignups);
    const [sendingEmailTo, setSendingEmailTo] = useState<{ signupId: number; type: string } | null>(null);
    const [actionStates, setActionStates] = useState({
        delete: new Set<number>(),
        status: new Set<number>()
    });

    const handleStatusChange = async (id: number, newStatus: string, onUpdateSelected?: (signup: TripSignup) => void) => {
        setActionStates(prev => ({ ...prev, status: new Set(prev.status).add(id) }));

        try {
            const res = await updateSignupStatus(id, newStatus);
            if (res.success) {
                const updatedStatus = newStatus as TripSignup['status'];
                setSignups(prev => prev.map(s => s.id === id ? { ...s, status: updatedStatus } : s));

                if (onUpdateSelected) {
                    const currentSignup = signups.find(s => s.id === id);
                    if (currentSignup) {
                        onUpdateSelected({ ...currentSignup, status: updatedStatus });
                    }
                }

                showToast(`Status succesvol bijgewerkt naar ${newStatus}`, 'success');
            } else {
                showToast(res.error || 'Fout bij bijwerken status.', 'error');
            }
        } catch {
            showToast('Fout bij bijwerken status.', 'error');
        } finally {
            setActionStates(prev => {
                const newSet = new Set(prev.status);
                newSet.delete(id);
                return { ...prev, status: newSet };
            });
        }
    };

    const handleDelete = async (id: number, onSuccess?: () => void) => {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen?')) return;

        setActionStates(prev => ({ ...prev, delete: new Set(prev.delete).add(id) }));
        try {
            const res = await deleteTripSignup(id);
            if (res.success) {
                setSignups(prev => prev.filter(s => s.id !== id));
                showToast('Aanmelding succesvol verwijderd', 'success');
                if (onSuccess) onSuccess();
            } else {
                showToast(res.error || 'Fout bij verwijderen aanmelding.', 'error');
            }
        } catch {
            showToast('Fout bij verwijderen aanmelding.', 'error');
        } finally {
            setActionStates(prev => {
                const newSet = new Set(prev.delete);
                newSet.delete(id);
                return { ...prev, delete: newSet };
            });
        }
    };

    const handleResendPaymentEmail = async (signupId: number, paymentType: 'deposit' | 'final', onUpdateSelected?: (signup: TripSignup) => void) => {
        const signup = signups.find(s => s.id === signupId);
        if (!signup) return;

        if (paymentType === 'deposit' && signup.deposit_paid) {
            if (!confirm('Deze persoon heeft de aanbetaling al betaald. Wil je toch een betaalverzoek sturen?')) return;
        }

        if (paymentType === 'final') {
            if (!signup.deposit_paid) {
                showToast('Aanbetaling nog niet betaald. Stuur eerst een aanbetalingsverzoek.', 'error');
                return;
            }
            if (signup.full_payment_paid) {
                if (!confirm('Deze persoon heeft al volledig betaald. Wil je toch een betaalverzoek sturen?')) return;
            }
        }

        setSendingEmailTo({ signupId, type: paymentType });

        try {
            const res = await sendPaymentEmail(signupId, trip.id, paymentType);

            if (res.success) {
                showToast(`${paymentType === 'deposit' ? 'Aanbetaling' : 'Restbetaling'}sverzoek succesvol verzonden naar ${signup.email}`, 'success');
                const update = (s: TripSignup) => s.id === signupId ? {
                    ...s,
                    [paymentType === 'deposit' ? 'deposit_email_sent' : 'final_email_sent']: true
                } : s;

                setSignups(prev => prev.map(update));
                if (onUpdateSelected) {
                    onUpdateSelected(update(signup));
                }
            } else {
                throw new Error(res.error);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Onbekende fout';
            showToast(`Fout bij verzenden email: ${message}`, 'error');
        } finally {
            setSendingEmailTo(null);
        }
    };

    return {
        signups,
        setSignups,
        sendingEmailTo,
        actionStates,
        handleStatusChange,
        handleDelete,
        handleResendPaymentEmail
    };
}
