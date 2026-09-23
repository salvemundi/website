'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Mail, Building2, MapPin, Image as ImageIcon, FileText, X } from 'lucide-react';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { TagInput } from '@/shared/ui/TagInput';
import { MarkdownEditor } from '@/shared/ui/MarkdownEditor';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import MediaAsset from '@/components/ui/media/MediaAsset';
import DocumentAsset from '@/components/ui/media/DocumentAsset';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { createVacancyAction, updateVacancyAction } from '@/server/actions/vacancies/vacancies-admin.actions';
import { vacancyAdminSchema, type VacancyAdminForm, ICT_DIRECTIONS } from '@salvemundi/validations';

interface VacancyAdminFormIslandProps {
    vacancyId?: number;
    initialData?: Partial<VacancyAdminForm> & { image?: string | null; document?: string | null };
}

export default function VacancyAdminFormIsland({ vacancyId, initialData }: VacancyAdminFormIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const isEditing = typeof vacancyId === 'number';

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [removeExistingImage, setRemoveExistingImage] = useState(false);
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [removeExistingDocument, setRemoveExistingDocument] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        control,
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
            skills: initialData?.skills ?? [],
            is_visible: initialData?.is_visible ?? true
        }
    });

    const type = watch('type');
    const selectedDirections = watch('directions');

    const handleImageChange = (file: File | null) => {
        setImageFile(file);
        setImagePreview(file ? URL.createObjectURL(file) : null);
        if (file) setRemoveExistingImage(false);
    };

    const onSubmit = async (data: VacancyAdminForm) => {
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
        formData.set('is_visible', String(data.is_visible));
        if (imageFile) formData.set('imageFile', imageFile);
        if (documentFile) formData.set('documentFile', documentFile);
        formData.set('removeImage', String(removeExistingImage));
        formData.set('removeDocument', String(removeExistingDocument));

        startTransition(async () => {
            const result = isEditing
                ? await updateVacancyAction(vacancyId, formData)
                : await createVacancyAction(formData);

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

            <div className="admin-container max-w-3xl py-4 md:py-8">
                <StandardFormCard title={isEditing ? 'Vacature bewerken' : 'Vacature aanmaken'} icon={<Briefcase className="size-8" />}>
                    <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-6" autoComplete="off">
                        <FormField id="field-type" label="Type vacature" required error={errors.type?.message}>
                            <select {...register('type')} id="field-type" className="form-input" suppressHydrationWarning>
                                <option value="parttime">Bijbaan (parttime)</option>
                                <option value="internship">Stage</option>
                            </select>
                        </FormField>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField id="field-title" label="Functietitel" required error={errors.title?.message}>
                                <Input {...register('title')} id="field-title" />
                            </FormField>
                            <FormField id="field-company" label="Bedrijfsnaam" required error={errors.company?.message}>
                                <div className="relative">
                                    <Building2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                    <Input {...register('company')} id="field-company" className="pl-10" />
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
                                    />
                                )}
                            />
                            <p className="mt-1 text-xs text-(--text-muted)">
                                Gebruik de knoppen voor opmaak, of klik op &quot;Voorbeeld&quot; om te zien hoe de omschrijving op de Bijbanenbank wordt weergegeven.
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
                                        placeholder="Typ een vaardigheid en druk op enter"
                                    />
                                )}
                            />
                        </FormField>

                        <FormField id="field-location" label="Locatie" required error={errors.location?.message}>
                            <div className="relative">
                                <MapPin className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                <Input {...register('location')} id="field-location" className="pl-10" />
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
                                <Input {...register('salary')} id="field-salary" />
                            </FormField>
                            <FormField id="field-employment-type" label="Dienstverband / StageType" error={errors.employment_type?.message}>
                                <Input {...register('employment_type')} id="field-employment-type" />
                            </FormField>
                            <FormField id="field-working-hours" label="Werktijden" error={errors.working_hours?.message}>
                                <Input {...register('working_hours')} id="field-working-hours" />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField id="field-image" label="Afbeelding">
                                <div className="flex items-center gap-3">
                                    {(imagePreview || (initialData?.image && !removeExistingImage)) && (
                                        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-(--bg-soft)">
                                            <MediaAsset asset={imagePreview || initialData?.image} alt="Voorbeeld" fill objectFit="cover" unoptimized={!!imagePreview} />
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
                                    {(imagePreview || (initialData?.image && !removeExistingImage)) && (
                                        <button
                                            type="button"
                                            onClick={() => { handleImageChange(null); setRemoveExistingImage(true); }}
                                            className="icon-button rounded-lg bg-(--bg-soft) p-2 text-(--text-muted) hover:text-(--theme-error)"
                                            aria-label="Verwijder afbeelding"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    )}
                                </div>
                            </FormField>

                            <FormField id="field-document" label="Stageopdracht (PDF/Word)">
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
                                        onChange={(e) => { setDocumentFile(e.target.files?.[0] || null); setRemoveExistingDocument(false); }}
                                        className="hidden"
                                    />
                                    {(documentFile || (initialData?.document && !removeExistingDocument)) && (
                                        <button
                                            type="button"
                                            onClick={() => { setDocumentFile(null); setRemoveExistingDocument(true); }}
                                            className="icon-button rounded-lg bg-(--bg-soft) p-2 text-(--text-muted) hover:text-(--theme-error)"
                                            aria-label="Verwijder document"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    )}
                                </div>
                                {initialData?.document && !documentFile && !removeExistingDocument && (
                                    <div className="mt-2">
                                        <DocumentAsset id={initialData.document} label="Huidig document bekijken" />
                                    </div>
                                )}
                            </FormField>
                        </div>

                        <div className="border-t border-(--border-color) pt-6">
                            <h3 className="mb-4 text-sm font-bold text-(--text-main)">Contactgegevens</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <FormField id="field-contact-email" label="E-mailadres" required error={errors.contact_email?.message}>
                                    <div className="relative">
                                        <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
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

                        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-(--text-main)">
                            <input type="checkbox" {...register('is_visible')} className="size-4 accent-(--theme-purple)" />
                            Zichtbaar op de website
                        </label>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="enabled:active:scale-0.98 form-button w-full rounded-xl bg-theme-purple py-4 font-black text-white shadow-lg shadow-purple-500/20 transition-all enabled:hover:bg-purple-600 disabled:opacity-50 sm:rounded-2xl"
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
