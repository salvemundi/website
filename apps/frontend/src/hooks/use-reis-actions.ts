import { useState, useTransition, useOptimistic } from 'react';
import type { Trip, TripSignup } from '@salvemundi/validations/schema/admin-reis.zod';
import { updateSignupStatus, deleteTripSignup, updateTripSignup, updateSignupActivities } from '@/server/actions/admin/reis-signups.actions';
import { sendPaymentEmail } from '@/server/actions/admin/reis-mail.actions';

import { type ToastType } from '@/components/ui/admin/AdminToast';

type OptimisticAction =
    | { type: 'update_status'; id: number; status: TripSignup['status'] }
    | { type: 'delete'; id: number }
    | { type: 'send_email'; id: number; emailField: 'deposit_email_sent' | 'final_email_sent' }
    | { type: 'save'; id: number; data: Partial<TripSignup> };

/**
 * Hook voor het beheren van reisaanmelding acties (status wijzigen, verwijderen, emails sturen).
 */
export function useReisActions(
    initialSignups: TripSignup[],
    trip: Trip,
    showToast: (message: string, type: ToastType) => void
) {
    const [isPending, startTransition] = useTransition();

    const [optimisticSignups, setOptimisticSignups] = useOptimistic<TripSignup[], OptimisticAction>(
        initialSignups,
        (state, action) => {
            switch (action.type) {
                case 'update_status':
                    return state.map(s => s.id === action.id ? { ...s, status: action.status } : s);
                case 'delete':
                    return state.filter(s => s.id !== action.id);
                case 'send_email':
                    return state.map(s => s.id === action.id ? { ...s, [action.emailField]: true } : s);
                case 'save':
                    return state.map(s => s.id === action.id ? { ...s, ...action.data } : s);
                default:
                    return state;
            }
        }
    );

    const [sendingEmailTo, setSendingEmailTo] = useState<{ signupId: number; type: string } | null>(null);
    const [actionStates, setActionStates] = useState({
        delete: new Set<number>(),
        status: new Set<number>()
    });

    const handleStatusChange = (id: number, newStatus: string) => {
        const updatedStatus = newStatus as TripSignup['status'];

        startTransition(async () => {
            setOptimisticSignups({ type: 'update_status', id, status: updatedStatus });
            setActionStates(prev => ({ ...prev, status: new Set(prev.status).add(id) }));

            try {
                const res = await updateSignupStatus(id, newStatus);
                if (res.success) {
                    showToast(`Status succesvol bijgewerkt naar ${newStatus}`, 'success');
                } else {
                    showToast(res.error || 'Fout bij bijwerken status.', 'error');
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Fout bij bijwerken status.';
                showToast(msg, 'error');
            } finally {
                setActionStates(prev => {
                    const newSet = new Set(prev.status);
                    newSet.delete(id);
                    return { ...prev, status: newSet };
                });
            }
        });
    };

    const handleDelete = (id: number, onSuccess?: () => void) => {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen?')) return;

        startTransition(async () => {
            setOptimisticSignups({ type: 'delete', id });
            setActionStates(prev => ({ ...prev, delete: new Set(prev.delete).add(id) }));
            try {
                const res = await deleteTripSignup(id);
                if (res.success) {
                    showToast('Aanmelding succesvol verwijderd', 'success');
                    if (onSuccess) onSuccess();
                } else {
                    showToast(res.error || 'Fout bij verwijderen aanmelding.', 'error');
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Fout bij verwijderen aanmelding.';
                showToast(msg, 'error');
            } finally {
                setActionStates(prev => {
                    const newSet = new Set(prev.delete);
                    newSet.delete(id);
                    return { ...prev, delete: newSet };
                });
            }
        });
    };

    const handleResendPaymentEmail = (signupId: number, paymentType: 'deposit' | 'final') => {
        const signup = optimisticSignups.find(s => s.id === signupId);
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

        startTransition(async () => {
            const emailField = paymentType === 'deposit' ? 'deposit_email_sent' : 'final_email_sent';
            setOptimisticSignups({ type: 'send_email', id: signupId, emailField });
            setSendingEmailTo({ signupId, type: paymentType });

            try {
                const res = await sendPaymentEmail(signupId, trip.id, paymentType);

                if (res.success) {
                    showToast(`${paymentType === 'deposit' ? 'Aanbetaling' : 'Restbetaling'}sverzoek succesvol verzonden naar ${signup.email}`, 'success');
                } else {
                    throw new Error(res.error);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Onbekende fout';
                showToast(`Fout bij verzenden email: ${message}`, 'error');
            } finally {
                setSendingEmailTo(null);
            }
        });
    };

    const handleSave = (
        signupId: number,
        formData: FormData,
        selectedActivities: number[],
        onSuccess?: () => void
    ) => {
        const updatedData = Object.fromEntries(formData.entries());
        const dataPayload = {
            ...updatedData,
            willing_to_drive: updatedData.willing_to_drive === 'on' || updatedData.willing_to_drive === 'true',
            deposit_paid: updatedData.deposit_paid === 'on' || updatedData.deposit_paid === 'true',
            full_payment_paid: updatedData.full_payment_paid === 'on' || updatedData.full_payment_paid === 'true',
            id: signupId
        } as Partial<TripSignup>;

        startTransition(async () => {
            setOptimisticSignups({ type: 'save', id: signupId, data: dataPayload });

            try {
                const res = await updateTripSignup(null, formData);
                if (!res.success) {
                    showToast(res.error || 'Fout bij het opslaan', 'error');
                    return;
                }

                const actRes = await updateSignupActivities(signupId, selectedActivities);
                if (!actRes.success) {
                    showToast(actRes.error || 'Fout bij bijwerken activiteiten', 'error');
                } else {
                    showToast('Wijzigingen opgeslagen', 'success');
                    if (onSuccess) onSuccess();
                }
            } catch {
                showToast('Er is een fout opgetreden', 'error');
            }
        });
    };

    return {
        signups: optimisticSignups,
        sendingEmailTo,
        actionStates,
        isPending,
        handleStatusChange,
        handleDelete,
        handleResendPaymentEmail,
        handleSave
    };
}
