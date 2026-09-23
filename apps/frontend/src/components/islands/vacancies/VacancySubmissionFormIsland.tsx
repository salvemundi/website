'use client';

import { useRef, useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Building2, MapPin, Briefcase, CheckCircle2, Image as ImageIcon, FileText, X, Send, ShieldCheck, Users, Info } from 'lucide-react';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { TagInput } from '@/shared/ui/TagInput';
import { MarkdownEditor } from '@/shared/ui/MarkdownEditor';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { useAdminToast } from '@/hooks/use-admin-toast';
import AdminToast from '@/components/ui/admin/AdminToast';
import { submitVacancy } from '@/server/actions/vacancies/vacancies-submission.actions';
import {
    vacancySubmissionSchema,
    type VacancySubmissionForm,
    ICT_DIRECTIONS
} from '@salvemundi/validations';

const PROCESS_STEPS = [
    { icon: <Send className="size-4" />, text: 'Je vult dit formulier in en verstuurt je aanmelding.' },
    { icon: <Mail className="size-4" />, text: 'Je ontvangt direct een e-mail met een link om je e-mailadres te bevestigen.' },
    { icon: <ShieldCheck className="size-4" />, text: 'Na bevestiging beoordeelt het bestuur van Salve Mundi je aanmelding.' },
    { icon: <Users className="size-4" />, text: 'Na goedkeuring is je vacature zichtbaar voor ingelogde leden van Salve Mundi — niet voor externe bezoekers van de website.' }
];

function ProcessExplanation() {
    return (
        <div className="mb-6 space-y-4 rounded-2xl border border-(--border-color) bg-(--bg-soft) p-6">
            <h2 className="flex items-center gap-2 text-sm font-bold text-(--text-main)">
                <Info className="size-4 text-(--theme-purple)" />
                Hoe werkt het?
            </h2>
            <ol className="space-y-3">
                {PROCESS_STEPS.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-(--theme-purple) text-xs font-bold text-white">
                            {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed text-(--text-muted)">{step.text}</p>
                    </li>
                ))}
            </ol>
        </div>
    );
}

export default function VacancySubmissionFormIsland() {
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [submitted, setSubmitted] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        control,
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
            skills: [],
            hp_confirm: ''
        }
    });

    const type = watch('type');
    const selectedDirections = watch('directions');

    const handleImageChange = (file: File | null) => {
        setImageFile(file);
        setImagePreview(file ? URL.createObjectURL(file) : null);
    };

    const onSubmit = async (data: VacancySubmissionForm) => {
        if (data.hp_confirm) return;

        const formData = new FormData();
        formData.set('title', data.title);
        formData.set('company', data.company);
        formData.set('description', data.description);
        formData.set('type', data.type);
        formData.set('contact_email', data.contact_email);
        formData.set('contact_phone', data.contact_phone || '');
        formData.set('contact_website', data.contact_website || '');
        formData.set('location', data.location);
        formData.set('salary', data.salary || '');
        formData.set('employment_type', data.employment_type || '');
        formData.set('working_hours', data.working_hours || '');
        formData.set('directions', JSON.stringify(data.directions));
        formData.set('skills', JSON.stringify(data.skills));
        formData.set('hp_confirm', data.hp_confirm || '');
        if (imageFile) formData.set('imageFile', imageFile);
        if (documentFile) formData.set('documentFile', documentFile);

        startTransition(async () => {
            const result = await submitVacancy(formData);
            if (result.success) {
                setSubmitted(true);
            } else {
                showToast(result.error || 'Er ging iets mis bij het versturen van je aanmelding.', 'error');
            }
        });
    };

    if (submitted) {
        return (
            <StandardFormCard title="Bedankt voor je aanmelding" icon={<CheckCircle2 className="size-8" />}>
                <p className="leading-relaxed text-(--text-main)">
                    We hebben je een e-mail gestuurd met een link om je e-mailadres te bevestigen. Zodra je dit
                    hebt gedaan, beoordeelt het bestuur van Salve Mundi je aanmelding. Na goedkeuring is je
                    vacature zichtbaar voor ingelogde leden van Salve Mundi — niet voor externe bezoekers van de
                    website.
                </p>
            </StandardFormCard>
        );
    }

    return (
        <>
            <ProcessExplanation />
            <StandardFormCard
                title="Vacature aanmelden"
                icon={<Briefcase className="size-8" />}
                description="Meld een stage of bijbaan aan voor leden van Salve Mundi."
            >
            <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-6" autoComplete="off">
                <FormField id="field-type" label="Type vacature" required error={errors.type?.message}>
                    <select {...register('type')} id="field-type" className="form-input" suppressHydrationWarning>
                        <option value="parttime">Bijbaan (parttime)</option>
                        <option value="internship">Stage</option>
                    </select>
                </FormField>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField id="field-title" label="Functietitel" required error={errors.title?.message}>
                        <Input {...register('title')} id="field-title" placeholder="Bijv. Frontend Developer" />
                    </FormField>
                    <FormField id="field-company" label="Bedrijfsnaam" required error={errors.company?.message}>
                        <div className="relative">
                            <Building2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                            <Input {...register('company')} id="field-company" placeholder="Bedrijfsnaam" className="pl-10" />
                        </div>
                    </FormField>
                </div>

                <FormField id="field-description" label="Omschrijving" required error={errors.description?.message}>
                    <Controller
                        control={control}
                        name="description"
                        render={({ field }) => (
                            <MarkdownEditor
                                id="field-description"
                                value={field.value}
                                onChange={field.onChange}
                                rows={10}
                                placeholder="Omschrijf de functie, verantwoordelijkheden en wat jullie zoeken in een kandidaat..."
                            />
                        )}
                    />
                    <p className="mt-1 text-xs text-(--text-muted)">
                        Gebruik de knoppen voor opmaak, of klik op &quot;Voorbeeld&quot; om te zien hoe je omschrijving straks op de Bijbanenbank wordt weergegeven.
                    </p>
                </FormField>

                <FormField id="field-skills" label="Gewenste vaardigheden" error={errors.skills?.message}>
                    <Controller
                        control={control}
                        name="skills"
                        render={({ field }) => (
                            <TagInput
                                id="field-skills"
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Typ een vaardigheid en druk op enter (bijv. React, Communicatief)"
                            />
                        )}
                    />
                </FormField>

                <FormField id="field-location" label="Locatie" required error={errors.location?.message}>
                    <div className="relative">
                        <MapPin className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <Input {...register('location')} id="field-location" placeholder="Bijv. Eindhoven" className="pl-10" />
                    </div>
                </FormField>

                {type === 'internship' && (
                    <FormField id="field-directions" label="ICT-richting(en)" required error={errors.directions?.message}>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {ICT_DIRECTIONS.map((option) => (
                                <label key={option} className="flex cursor-pointer items-center gap-2 rounded-xl bg-(--bg-soft) px-3 py-2 text-sm font-medium text-(--text-main)">
                                    <input
                                        type="checkbox"
                                        value={option}
                                        checked={selectedDirections.includes(option)}
                                        {...register('directions')}
                                        className="size-4 accent-(--theme-purple)"
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    </FormField>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField id="field-salary" label="Salaris / vergoeding" error={errors.salary?.message}>
                        <Input {...register('salary')} id="field-salary" placeholder="Bijv. €12,50 per uur" />
                    </FormField>
                    <FormField id="field-employment-type" label="Dienstverband/stage type" error={errors.employment_type?.message}>
                        <Input {...register('employment_type')} id="field-employment-type" placeholder="Bijv. Fulltime" />
                    </FormField>
                    <FormField id="field-working-hours" label="Werktijden" error={errors.working_hours?.message}>
                        <Input {...register('working_hours')} id="field-working-hours" placeholder="Bijv. 16-24 uur/week" />
                    </FormField>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField id="field-image" label="Afbeelding (optioneel)">
                        <div className="flex items-center gap-3">
                            {imagePreview && (
                                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-(--bg-soft)">
                                    <MediaAsset asset={imagePreview} alt="Voorbeeld" fill objectFit="cover" unoptimized />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                className="btn-upload flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--bg-soft) px-4 py-2.5 text-sm font-bold text-(--text-muted) transition-colors hover:text-(--theme-purple)"
                            >
                                <ImageIcon className="size-4" />
                                {imageFile ? imageFile.name : 'Kies afbeelding'}
                            </button>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                        </div>
                    </FormField>

                    <FormField id="field-document" label="Stageopdracht (PDF/Word, optioneel)">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => documentInputRef.current?.click()}
                                className="btn-upload flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--bg-soft) px-4 py-2.5 text-sm font-bold text-(--text-muted) transition-colors hover:text-(--theme-purple)"
                            >
                                <FileText className="size-4" />
                                {documentFile ? documentFile.name : 'Kies bestand'}
                            </button>
                            <input
                                ref={documentInputRef}
                                type="file"
                                accept="application/pdf,.doc,.docx"
                                onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            {documentFile && (
                                <button type="button" onClick={() => setDocumentFile(null)} className="icon-button rounded-lg bg-(--bg-soft) p-2 text-(--text-muted) hover:text-(--theme-error)" aria-label="Verwijder document">
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                    </FormField>
                </div>

                <div className="border-t border-(--border-color) pt-6">
                    <h3 className="mb-4 text-sm font-bold text-(--text-main)">Contactgegevens</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormField id="field-contact-email" label="E-mailadres" required error={errors.contact_email?.message}>
                            <div className="relative">
                                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
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
                    className="enabled:active:scale-0.98 form-button flex w-full items-center justify-center gap-2 rounded-xl bg-theme-purple py-4 text-lg font-black text-white shadow-lg shadow-purple-500/20 transition-all enabled:hover:bg-purple-600 disabled:opacity-50 sm:rounded-2xl"
                >
                    {isPending ? (
                        <>
                            <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Versturen...
                        </>
                    ) : (
                        'Vacature aanmelden'
                    )}
                </button>

                {/* Honeypot at bottom to avoid breaking browser autofill sections */}
                <div className="pointer-events-none absolute top-0 left-0 -z-10 size-0 overflow-hidden opacity-0" aria-hidden="true">
                    <label htmlFor="hp_confirm">Website</label>
                    <input {...register('hp_confirm')} id="hp_confirm" tabIndex={-1} autoComplete="off" className="hidden" suppressHydrationWarning />
                </div>
            </form>
                <AdminToast toast={toast} onClose={hideToast} />
            </StandardFormCard>
        </>
    );
}
