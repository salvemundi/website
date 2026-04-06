'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createTripSignup, getCurrentUserProfileAction } from '@/server/actions/reis.actions';
import type { ReisTrip } from '@salvemundi/validations';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { useAdminToast } from '@/hooks/use-admin-toast';
import AdminToast from '@/components/ui/admin/AdminToast';

interface ReisRegistrationFormProps {
    nextTrip: ReisTrip | null;
    canSignUp: boolean;
    registrationStartText: string;
    currentUser: any;
    onRefresh?: () => void;
}

export function ReisRegistrationForm({
    nextTrip,
    canSignUp,
    registrationStartText,
    currentUser,
    onRefresh
}: ReisRegistrationFormProps) {
    const [isSuccess, setIsSuccess] = useState(false);
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        date_of_birth: '' as string,
        terms_accepted: false,
    });
    const [loading, setLoading] = useState(false);
    const { toast, showToast, hideToast } = useAdminToast();
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        const prefillData = async () => {
            if (!currentUser) return;

            // Helper to format date for input type="date" (YYYY-MM-DD)
            const formatDateForInput = (dateStr?: string | null) => {
                if (!dateStr) return '';
                try {
                    // Check if already in YYYY-MM-DD format to avoid timezone shifts
                    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;

                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) return '';
                    return date.toISOString().split('T')[0];
                } catch {
                    return '';
                }
            };

            // 1. Initial pre-fill from basic session data (prioritize this)
            setForm(prev => {
                const birthdateFromAuth = formatDateForInput((currentUser as any).date_of_birth);
                const phoneFromAuth = (currentUser as any).phone_number || '';

                return {
                    ...prev,
                    last_name: prev.last_name || (currentUser as any).last_name || '',
                    email: prev.email || currentUser?.email || '',
                    phone_number: prev.phone_number || phoneFromAuth,
                    date_of_birth: prev.date_of_birth || birthdateFromAuth,
                };
            });

            // 2. Enrich with full profile from Directus (fallback/enhancement)
            const profile = await getCurrentUserProfileAction();
            if (profile.success && profile.data) {
                setForm(prev => ({
                    ...prev,
                    // First name is explicitly NOT pre-filled as requested
                    last_name: prev.last_name || profile.data.last_name || '',
                    email: prev.email || profile.data.email || '',
                    phone_number: prev.phone_number || profile.data.phone_number || '',
                    date_of_birth: prev.date_of_birth || formatDateForInput(profile.data.date_of_birth),
                }));
            }
        };

        prefillData();
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        if (type === 'checkbox') {
            setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setForm({ ...form, [name]: value });
        }
        if (localError) setLocalError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!form.first_name || !form.last_name || !form.email || !form.phone_number || !form.date_of_birth) {
            setLocalError('Vul alle verplichte velden in.');
            return;
        }

        if (!form.terms_accepted) {
            setLocalError('Je moet de algemene voorwaarden accepteren om door te gaan.');
            return;
        }

        if (!nextTrip) {
            setLocalError('Er is momenteel geen reis beschikbaar.');
            return;
        }

        setLoading(true);
        try {
            const result = await createTripSignup(form as any, nextTrip.id);
            if (!result.success) {
                showToast(result.message || 'Fout bij inschrijven.', 'error');
            } else {
                setIsSuccess(true);
                showToast('Je bent succesvol ingeschreven!', 'success');
                
                if (currentUser && onRefresh) {
                    setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        onRefresh();
                    }, 1000);
                }
            }
        } catch {
            showToast('Er is een onverwachte fout opgetreden bij het verzenden.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-theme-purple/5 rounded-2xl border border-theme-purple/10">
                <div className="w-16 h-16 bg-theme-purple/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-theme-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-theme-purple dark:text-theme-white mb-2">Inschrijving Ontvangen!</h2>
                <p className="text-theme-text-muted mb-6">
                    {currentUser 
                        ? 'Bedankt voor je inschrijving. Je status wordt nu bijgewerkt...' 
                        : `Bedankt voor je inschrijving! We hebben een bevestigingsmail gestuurd naar ${form.email}. Check ook je spam-folder.`}
                </p>
                {!currentUser && (
                    <button 
                        onClick={() => setIsSuccess(false)}
                        className="text-sm font-semibold text-theme-purple hover:underline"
                    >
                        Nog iemand inschrijven?
                    </button>
                )}
            </div>
        );
    }

    if (!nextTrip) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-theme-purple/5 rounded-2xl border border-theme-purple/10">
                <div className="w-16 h-16 bg-theme-purple/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-theme-purple opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-theme-purple dark:text-theme-white mb-2">Geen reis gepland</h2>
                <p className="text-theme-text-muted text-sm max-w-xs">
                    Momenteel is er geen reis gepland. Houd deze pagina in de gaten voor nieuwe data!
                </p>
            </div>
        );
    }

    if (!canSignUp) {
        return (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center bg-gray-500/5 rounded-2xl border border-gray-500/10 animate-in fade-in duration-700">
                <div className="w-12 h-12 bg-gray-500/10 rounded-full flex items-center justify-center mb-4">
                    <Loader2 className="w-6 h-6 text-gray-500 opacity-40" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">Inschrijving Gesloten</h3>
                <p className="text-theme-text-muted text-sm max-w-xs">
                    {registrationStartText}
                </p>
                <div className="mt-6 pt-6 border-t border-gray-500/10 w-full font-medium">
                    <p className="text-[10px] uppercase tracking-wider text-theme-text-muted/60">
                        Houd onze socials in de gaten voor updates
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500" onSubmit={handleSubmit}>
            {localError && (
                <div className="bg-red-500/10 text-red-500 px-4 py-3 rounded-xl border border-red-500/20 text-sm font-medium">
                    {localError}
                </div>
            )}

            <p className="text-theme-text dark:text-white/90 text-sm mb-2">
                Let op: dit is een vrijblijvende aanmelding. De daadwerkelijke betaling volgt later.
            </p>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4">
                    <FormField label="Voornaam" required error={localError && !form.first_name ? 'Verplicht' : undefined}>
                        <Input
                            name="first_name"
                            value={form.first_name}
                            onChange={handleChange}
                            required
                            placeholder="Voornaam"
                            autoComplete="given-name"
                        />
                        <span className="text-xs text-theme-text-muted/80 mt-1 block font-normal">
                            Gebruik je volledige naam zoals op je paspoort/ID
                        </span>
                    </FormField>
                </div>

                <FormField label="Tussenvoegsel & Achternaam" required error={localError && !form.last_name ? 'Verplicht' : undefined}>
                    <Input
                        name="last_name"
                        value={form.last_name}
                        onChange={handleChange}
                        required
                        placeholder="Achternaam (incl. tussenvoegsel)"
                        autoComplete="family-name"
                    />
                </FormField>

                <FormField label="E-mailadres" required error={localError && !form.email ? 'Verplicht' : undefined}>
                    <Input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="jouw@email.nl"
                        autoComplete="email"
                    />
                </FormField>

                <FormField label="Geboortedatum" required error={localError && !form.date_of_birth ? 'Verplicht' : undefined}>
                    <Input
                        type="date"
                        name="date_of_birth"
                        value={form.date_of_birth}
                        onChange={handleChange}
                        required
                        autoComplete="bday"
                    />
                </FormField>

                <FormField label="Telefoonnummer" required error={localError && !form.phone_number ? 'Verplicht' : undefined}>
                    <PhoneInput
                        name="phone_number"
                        value={form.phone_number}
                        onChange={handleChange}
                        required
                        autoComplete="tel"
                    />
                </FormField>
            </div>

            <label className="flex items-start gap-3 text-theme-text dark:text-white mt-2 cursor-pointer group">
                <input
                    type="checkbox"
                    name="terms_accepted"
                    checked={form.terms_accepted}
                    onChange={handleChange}
                    required
                    className="mt-1 h-5 w-5 rounded border-theme-purple/20 accent-theme-purple transition-all group-hover:scale-110"
                />
                <span className="text-sm leading-snug">
                    Ik accepteer de{' '}
                    <a href="/reisvoorwaarden.pdf" download className="underline font-semibold text-theme-purple hover:text-theme-purple/80" target="_blank" rel="noopener noreferrer">
                        algemene voorwaarden
                    </a>
                </span>
            </label>

            <button
                type="submit"
                disabled={loading}
                className="form-button mt-4 group"
            >
                <span>
                    {loading ? 'Bezig met aanmelden...' : 'Aanmelden voor de reis'}
                </span>
                {!loading && <span className="group-hover:translate-x-1 transition-transform inline-block ml-2">→</span>}
            </button>
            <AdminToast toast={toast} onClose={hideToast} />
        </form>
    );

}
