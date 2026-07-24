'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Building2, MapPin, Briefcase, CheckCircle2 } from 'lucide-react';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';
import { useAdminToast } from '@/hooks/use-admin-toast';
import AdminToast from '@/components/ui/admin/AdminToast';
import { submitVacancy } from '@/server/actions/vacancies/vacancies-submission.actions';
import {
    vacancySubmissionSchema,
    type VacancySubmissionForm,
    ICT_DIRECTIONS
} from '@salvemundi/validations';

export default function VacancySubmissionFormIsland() {
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [submitted, setSubmitted] = useState(false);

    const {
        register,
        watch,
        handleSubmit,
        formState: { errors }
    } = useForm<VacancySubmissionForm>({
        resolver: zodResolver(vacancySubmissionSchema),
        defaultValues: {
            title: '',
            company: '',
            description: '',
            type: 'parttime',
            contact_email: '',
            contact_phone: '',
            contact_website: '',
            location: '',
            salary: '',
            employment_type: '',
            working_hours: '',
            directions: [],
            hp_confirm: ''
        }
    });

    const type = watch('type');
    const selectedDirections = watch('directions');

    const onSubmit = async (data: VacancySubmissionForm) => {
        if (data.hp_confirm) return;

        startTransition(async () => {
            const result = await submitVacancy(data);
            if (result.success) {
                setSubmitted(true);
            } else {
                showToast(result.error || 'Er ging iets mis bij het versturen van je aanmelding.', 'error');
            }
        });
    };

    if (submitted) {
        return (
            <StandardFormCard title="Bedankt voor je aanmelding" icon={<CheckCircle2 className="w-8 h-8" />}>
                <p className="text-(--text-main) leading-relaxed">
                    We hebben je een e-mail gestuurd met een verificatielink. Zodra je je e-mailadres hebt
                    bevestigd, komt je vacature in de beoordelingswachtrij voor onze commissie te staan.
                </p>
            </StandardFormCard>
        );
    }

    return (
        <StandardFormCard
            title="Vacature aanmelden"
            icon={<Briefcase className="w-8 h-8" />}
            description="Meld een stage of bijbaan aan voor leden van Salve Mundi. Na verificatie van je e-mailadres wordt je aanmelding beoordeeld door onze commissie."
        >
            <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-6" autoComplete="off">
                <FormField id="field-type" label="Type vacature" required error={errors.type?.message}>
                    <select {...register('type')} id="field-type" className="form-input" suppressHydrationWarning>
                        <option value="parttime">Bijbaan (parttime)</option>
                        <option value="internship">Stage</option>
                    </select>
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="field-title" label="Functietitel" required error={errors.title?.message}>
                        <Input {...register('title')} id="field-title" placeholder="Bijv. Frontend Developer" />
                    </FormField>
                    <FormField id="field-company" label="Bedrijfsnaam" required error={errors.company?.message}>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input {...register('company')} id="field-company" placeholder="Bedrijfsnaam" className="pl-10" />
                        </div>
                    </FormField>
                </div>

                <FormField id="field-description" label="Omschrijving" required error={errors.description?.message}>
                    <textarea {...register('description')} id="field-description" rows={6} className="form-input" placeholder="Omschrijf de functie, verantwoordelijkheden en wat jullie zoeken in een kandidaat..." />
                </FormField>

                <FormField id="field-location" label="Locatie" required error={errors.location?.message}>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input {...register('location')} id="field-location" placeholder="Bijv. Eindhoven" className="pl-10" />
                    </div>
                </FormField>

                {type === 'internship' && (
                    <FormField id="field-directions" label="ICT-richting(en)" required error={errors.directions?.message}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ICT_DIRECTIONS.map((option) => (
                                <label key={option} className="flex items-center gap-2 text-sm font-medium text-(--text-main) bg-(--bg-soft) rounded-xl px-3 py-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value={option}
                                        checked={selectedDirections.includes(option)}
                                        {...register('directions')}
                                        className="h-4 w-4 accent-(--theme-purple)"
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    </FormField>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField id="field-salary" label="Salaris / vergoeding" error={errors.salary?.message}>
                        <Input {...register('salary')} id="field-salary" placeholder="Bijv. €12,50 per uur" />
                    </FormField>
                    <FormField id="field-employment-type" label="Dienstverband" error={errors.employment_type?.message}>
                        <Input {...register('employment_type')} id="field-employment-type" placeholder="Bijv. Fulltime" />
                    </FormField>
                    <FormField id="field-working-hours" label="Werktijden" error={errors.working_hours?.message}>
                        <Input {...register('working_hours')} id="field-working-hours" placeholder="Bijv. 16-24 uur/week" />
                    </FormField>
                </div>

                <div className="border-t border-(--border-color) pt-6">
                    <h3 className="text-sm font-bold text-(--text-main) mb-4">Contactgegevens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField id="field-contact-email" label="E-mailadres" required error={errors.contact_email?.message}>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input {...register('contact_email')} id="field-contact-email" type="email" placeholder="contact@bedrijf.nl" className="pl-10" />
                            </div>
                        </FormField>
                        <FormField id="field-contact-phone" label="Telefoonnummer" error={errors.contact_phone?.message}>
                            <Input {...register('contact_phone')} id="field-contact-phone" placeholder="+31612345678" />
                        </FormField>
                        <FormField id="field-contact-website" label="Website" error={errors.contact_website?.message}>
                            <Input {...register('contact_website')} id="field-contact-website" placeholder="https://bedrijf.nl" />
                        </FormField>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="form-button w-full bg-theme-purple enabled:hover:bg-purple-600 text-white font-black py-4 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-purple-500/20 enabled:active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                >
                    {isPending ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Versturen...
                        </>
                    ) : (
                        'Vacature aanmelden'
                    )}
                </button>

                {/* Honeypot at bottom to avoid breaking browser autofill sections */}
                <div className="opacity-0 absolute top-0 left-0 h-0 w-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
                    <label htmlFor="hp_confirm">Website</label>
                    <input {...register('hp_confirm')} id="hp_confirm" tabIndex={-1} autoComplete="off" className="hidden" suppressHydrationWarning />
                </div>
            </form>
            <AdminToast toast={toast} onClose={hideToast} />
        </StandardFormCard>
    );
}
