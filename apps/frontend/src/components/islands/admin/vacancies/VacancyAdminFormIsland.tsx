'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Mail, Building2, MapPin } from 'lucide-react';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { createVacancyAction, updateVacancyAction } from '@/server/actions/vacancies/vacancies-admin.actions';
import { vacancyAdminSchema, type VacancyAdminForm, ICT_DIRECTIONS } from '@salvemundi/validations';

interface VacancyAdminFormIslandProps {
    vacancyId?: number;
    initialData?: Partial<VacancyAdminForm>;
}

export default function VacancyAdminFormIsland({ vacancyId, initialData }: VacancyAdminFormIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const isEditing = typeof vacancyId === 'number';

    const {
        register,
        watch,
        handleSubmit,
        formState: { errors }
    } = useForm<VacancyAdminForm>({
        resolver: zodResolver(vacancyAdminSchema),
        defaultValues: {
            title: initialData?.title ?? '',
            company: initialData?.company ?? '',
            description: initialData?.description ?? '',
            type: initialData?.type ?? 'parttime',
            contact_email: initialData?.contact_email ?? '',
            contact_phone: initialData?.contact_phone ?? '',
            contact_website: initialData?.contact_website ?? '',
            location: initialData?.location ?? '',
            salary: initialData?.salary ?? '',
            employment_type: initialData?.employment_type ?? '',
            working_hours: initialData?.working_hours ?? '',
            directions: initialData?.directions ?? [],
            is_visible: initialData?.is_visible ?? true
        }
    });

    const type = watch('type');
    const selectedDirections = watch('directions');

    const onSubmit = async (data: VacancyAdminForm) => {
        startTransition(async () => {
            const result = isEditing
                ? await updateVacancyAction(vacancyId, data)
                : await createVacancyAction(data);

            if (result.success) {
                showToast(isEditing ? 'Vacature bijgewerkt.' : 'Vacature aangemaakt.', 'success');
                router.push('/beheer/bijbanenbank');
                router.refresh();
            } else {
                showToast(result.error || 'Opslaan mislukt.', 'error');
            }
        });
    };

    return (
        <div className="pb-20">
            <AdminToolbar
                title={isEditing ? 'Vacature Bewerken' : 'Nieuwe Vacature'}
                backHref="/beheer/bijbanenbank"
            />

            <div className="admin-container py-4 md:py-8 max-w-3xl">
                <StandardFormCard title={isEditing ? 'Vacature bewerken' : 'Vacature aanmaken'} icon={<Briefcase className="w-8 h-8" />}>
                    <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-6" autoComplete="off">
                        <FormField id="field-type" label="Type vacature" required error={errors.type?.message}>
                            <select {...register('type')} id="field-type" className="form-input" suppressHydrationWarning>
                                <option value="parttime">Bijbaan (parttime)</option>
                                <option value="internship">Stage</option>
                            </select>
                        </FormField>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField id="field-title" label="Functietitel" required error={errors.title?.message}>
                                <Input {...register('title')} id="field-title" />
                            </FormField>
                            <FormField id="field-company" label="Bedrijfsnaam" required error={errors.company?.message}>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input {...register('company')} id="field-company" className="pl-10" />
                                </div>
                            </FormField>
                        </div>

                        <FormField id="field-description" label="Omschrijving" required error={errors.description?.message}>
                            <textarea {...register('description')} id="field-description" rows={6} className="form-input" />
                        </FormField>

                        <FormField id="field-location" label="Locatie" required error={errors.location?.message}>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input {...register('location')} id="field-location" className="pl-10" />
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
                                <Input {...register('salary')} id="field-salary" />
                            </FormField>
                            <FormField id="field-employment-type" label="Dienstverband" error={errors.employment_type?.message}>
                                <Input {...register('employment_type')} id="field-employment-type" />
                            </FormField>
                            <FormField id="field-working-hours" label="Werktijden" error={errors.working_hours?.message}>
                                <Input {...register('working_hours')} id="field-working-hours" />
                            </FormField>
                        </div>

                        <div className="border-t border-(--border-color) pt-6">
                            <h3 className="text-sm font-bold text-(--text-main) mb-4">Contactgegevens</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField id="field-contact-email" label="E-mailadres" required error={errors.contact_email?.message}>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input {...register('contact_email')} id="field-contact-email" type="email" className="pl-10" />
                                    </div>
                                </FormField>
                                <FormField id="field-contact-phone" label="Telefoonnummer" error={errors.contact_phone?.message}>
                                    <Input {...register('contact_phone')} id="field-contact-phone" />
                                </FormField>
                                <FormField id="field-contact-website" label="Website" error={errors.contact_website?.message}>
                                    <Input {...register('contact_website')} id="field-contact-website" />
                                </FormField>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm font-semibold text-(--text-main) cursor-pointer">
                            <input type="checkbox" {...register('is_visible')} className="h-4 w-4 accent-(--theme-purple)" />
                            Zichtbaar op de website
                        </label>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="form-button w-full bg-theme-purple enabled:hover:bg-purple-600 text-white font-black py-4 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-purple-500/20 enabled:active:scale-[0.98] disabled:opacity-50"
                        >
                            {isPending ? 'Opslaan...' : isEditing ? 'Wijzigingen opslaan' : 'Vacature aanmaken'}
                        </button>
                    </form>
                </StandardFormCard>
            </div>

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
