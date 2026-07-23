'use client';

import { useOptimistic, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { createActivityAction } from '@/server/actions/events/activiteiten/activiteiten-write.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { useActivityForm, ActivityStatus } from '@/hooks/use-activity-form';
import {
    GeneralInfoSection,
    PlanningLocationSection,
    CapacityCostsSection,
    BannerSection,
    StatusSection
} from '@/components/admin/activities/ActivityFormSections';

interface Committee {
    id: number;
    name: string;
    email?: string | null;
}

interface ActionState {
    success: boolean;
    id?: number;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    initialData?: { [key: string]: unknown };
}

interface ActiviteitNieuwIslandProps {
    committees?: Committee[];
}

export default function ActiviteitNieuwIsland({
    committees = []
}: ActiviteitNieuwIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();

    const {
        status, setStatus,
        onlyMembers, setOnlyMembers,
        contactEmail, setContactEmail,
        imageFile,
        imagePreview,
        fileInputRef,
        handleImageChange,
        handleRemoveImage,
        handleCommitteeChange
    } = useActivityForm({
        committees
    });

    const [state, formAction, isPending] = useActionState<ActionState, FormData>(
        async (prevState: ActionState, formData: FormData) => {
            if (imageFile) formData.append('imageFile', imageFile);
            formData.set('status', status);
            formData.set('only_members', onlyMembers ? 'on' : 'off');

            const res = await createActivityAction(prevState, formData);
            return res as ActionState;
        },
        { success: false }
    );

    useEffect(() => {
        if (state.success && state.id) {
            showToast('Activiteit succesvol aangemaakt!', 'success');
            const timer = setTimeout(() => {
                router.push(`/beheer/activiteiten/${state.id}/bewerken`);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (state.error) {
            showToast(state.error, 'error');

            if (state.initialData) {
                const data = state.initialData;
                if (typeof data.status === 'string') setStatus(data.status as ActivityStatus);
                if (data.only_members !== undefined) setOnlyMembers(data.only_members === 'on' || data.only_members === true);
                if (typeof data.contact === 'string') setContactEmail(data.contact);
            }
        }
    }, [state, showToast, router, setStatus, setOnlyMembers, setContactEmail]);

    const [optimisticSaving] = useOptimistic(isPending);
    const initialData = state.initialData as { [key: string]: unknown } | undefined;

    const handleValidatedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const MAX_SIZE_MB = 10;

    if (file && file.size > MAX_SIZE_MB * 1024 * 1024) {
        showToast(`Bestand is te groot. Maximaal ${MAX_SIZE_MB}MB toegestaan.`, 'error');
        e.target.value = '';
        return;
    }
    
    handleImageChange(e);
    };
    return (
        <div className="pb-20">
            <AdminToolbar
                title="Nieuwe activiteit"
                backHref="/beheer/activiteiten"
            />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <form action={formAction} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-8">
                            <GeneralInfoSection initialData={initialData} formErrors={state.fieldErrors} />
                        </div>

                        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
                            <BannerSection
                                imagePreview={imagePreview}
                                onUploadClick={() => fileInputRef.current?.click()}
                                onRemoveClick={handleRemoveImage}
                                fileInputRef={fileInputRef}
                                onFileChange={handleValidatedImageChange}
                            />
                            <StatusSection
                                status={status}
                                onStatusChange={(val) => setStatus(val as ActivityStatus)}
                                initialData={initialData}
                            />

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={optimisticSaving}
                                    className="form-button w-full bg-(--beheer-accent) text-white px-8 py-4 rounded-xl font-semibold text-base shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group border border-white/10"
                                >
                                    {optimisticSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                                    <span>{optimisticSaving ? 'Bezig...' : 'Activiteit aanmaken'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="beheer-button w-full px-8 py-4 rounded-xl font-semibold text-base border border-(--beheer-border) text-(--beheer-text) hover:bg-(--beheer-card-soft) transition-all cursor-pointer"
                                >
                                    Annuleren
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PlanningLocationSection initialData={initialData} formErrors={state.fieldErrors} />
                        <CapacityCostsSection
                            initialData={initialData}
                            committees={committees}
                            contactEmail={contactEmail}
                            onContactEmailChange={setContactEmail}
                            onCommitteeChange={handleCommitteeChange}
                            onlyMembers={onlyMembers}
                            onOnlyMembersChange={setOnlyMembers}
                            formErrors={state.fieldErrors}
                        />
                    </div>
                </form>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
