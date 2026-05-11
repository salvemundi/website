'use client';

import { useState, useOptimistic, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Trash2 } from 'lucide-react';
import { updateActivityAction, deleteActivity } from '@/server/actions/activiteiten/activities-write.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { AdminActivity, Committee } from '@salvemundi/validations';

// Refactored Modules
import { useActivityForm, ActivityStatus } from '@/hooks/use-activity-form';
import { 
    GeneralInfoSection, 
    PlanningLocationSection, 
    CapacityCostsSection, 
    BannerSection, 
    StatusSection 
} from '@/components/admin/activities/ActivityFormSections';

interface ActionState {
    success: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    initialData?: Record<string, unknown>;
}

interface ActiviteitBewerkenIslandProps {
    event?: AdminActivity;
    committees?: Committee[];
}

/**
 * ActiviteitBewerkenIsland: Panel voor het aanpassen van een bestaande activiteit.
 * Nu onder de 300 regels door extractie van secties en form-logica.
 */
export default function ActiviteitBewerkenIsland({ 
    event = {} as AdminActivity, 
    committees = [] 
}: ActiviteitBewerkenIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    
    // 1. Shared Form Logic Hook
    const {
        status, setStatus,
        onlyMembers, setOnlyMembers,
        contactEmail, setContactEmail,
        imageFile,
        removeExistingImage,
        imagePreview,
        fileInputRef,
        handleImageChange,
        handleRemoveImage,
        handleCommitteeChange
    } = useActivityForm({
        initialStatus: (event.status === 'draft' ? 'draft' : (event.publish_date ? 'scheduled' : 'published')) as ActivityStatus,
        initialOnlyMembers: !!event.only_members,
        initialContactEmail: event.contact || '',
        initialImage: event.image,
        committees
    });

    // 2. Action Handlers
    const [state, formAction, isPending] = useActionState<ActionState, FormData>(async (prevState: ActionState, formData: FormData) => {
        if (imageFile) formData.append('imageFile', imageFile);
        if (removeExistingImage) formData.append('removeImage', 'true');
        formData.set('status', status);
        formData.set('only_members', onlyMembers ? 'on' : 'off');

        const res = await updateActivityAction(event.id, prevState, formData);
        if (res.success) {
            showToast('Activiteit succesvol bijgewerkt!', 'success');
            router.refresh();
        } else {
            showToast(res.error || 'Er is een fout opgetreden', 'error');
        }
        return res;
    }, { success: false });

    // Sync controlled fields if initialData returns after failure
    useEffect(() => {
        if (state?.initialData) {
            const data = state.initialData as Record<string, string | boolean | undefined>;
            if (data.status && typeof data.status === 'string') setStatus(data.status as ActivityStatus);
            if (data.only_members !== undefined) setOnlyMembers(data.only_members === 'on' || data.only_members === true);
            if (data.contact && typeof data.contact === 'string') setContactEmail(data.contact);
        }
    }, [state?.initialData, setStatus, setOnlyMembers, setContactEmail]);

    const [optimisticSaving] = useOptimistic(isPending);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Weet je zeker dat je "${event.name}" wilt verwijderen?`)) return;
        setIsDeleting(true);
        try {
            const res = await deleteActivity(event.id);
            if (res.success) {
                showToast('Activiteit succesvol verwijderd', 'success');
                router.push('/beheer/activiteiten');
            } else {
                showToast(res.error || 'Fout bij verwijderen', 'error');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="pb-20">
            <AdminToolbar title="Bewerk Activiteit" subtitle={`Wijzig "${event.name}"`} backHref="/beheer/activiteiten" />
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <form action={formAction}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-8 space-y-6">
                            <GeneralInfoSection initialData={state.initialData || event} formErrors={state.fieldErrors} />
                            <PlanningLocationSection initialData={state.initialData || event} formErrors={state.fieldErrors} />
                            <CapacityCostsSection 
                                initialData={state.initialData || event} 
                                committees={committees} 
                                contactEmail={contactEmail}
                                onContactEmailChange={setContactEmail}
                                onCommitteeChange={handleCommitteeChange}
                                onlyMembers={onlyMembers}
                                onOnlyMembersChange={setOnlyMembers}
                            />
                        </div>

                        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
                            <BannerSection 
                                imagePreview={imagePreview} 
                                onUploadClick={() => fileInputRef.current?.click()} 
                                onRemoveClick={handleRemoveImage} 
                                fileInputRef={fileInputRef}
                                onFileChange={handleImageChange}
                            />
                            <StatusSection status={status} onStatusChange={setStatus} initialData={state.initialData || event} />

                            <div className="space-y-3">
                                <button type="submit" disabled={optimisticSaving} className="w-full bg-[var(--beheer-accent)] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group border border-white/10">
                                    {optimisticSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                                    <span>{optimisticSaving ? 'Opslaan...' : 'Wijzigingen Opslaan'}</span>
                                </button>
                                <button type="button" onClick={() => router.back()} className="w-full px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)] transition-all cursor-pointer">Annuleren</button>
                                <div className="pt-4 border-t border-[var(--beheer-border)]/30">
                                    <button type="button" onClick={handleDelete} disabled={isDeleting || optimisticSaving} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-50 cursor-pointer active:scale-95 group border border-red-500/20">
                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                                        Activiteit Verwijderen
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
