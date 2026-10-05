'use client';

import { useOptimistic, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, X } from 'lucide-react';
import { createActivityAction } from '@/server/actions/events/activiteiten/activiteiten-write.actions';
import BeheerToolbar from '@/components/ui/beheer/BeheerToolbar';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';
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
            <BeheerToolbar
                title="Nieuwe activiteit"
                backHref="/beheer/activiteiten"
            />
            <div className="container-beheer py-8">
                <form action={formAction} className="space-y-6">
                    <div className="beheer-grid-12">
                        <div className="lg:col-span-8">
                            <GeneralInfoSection initialData={initialData} formErrors={state.fieldErrors} />
                        </div>

                        <div className="space-y-6 lg:sticky lg:top-8 lg:col-span-4">
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
                                    className="form-button w-full text-base"
                                >
                                    {optimisticSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                    <span>{optimisticSaving ? 'Bezig...' : 'Activiteit aanmaken'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="btn-cancel"
                                >
                                    <X className="size-4 text-text-muted" />
                                    <span>Annuleren</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

                    {/* Mobile bottom action buttons */}
                    <div className="block space-y-3 pt-4 lg:hidden">
                        <button
                            type="submit"
                            disabled={optimisticSaving}
                            className="form-button w-full text-base"
                        >
                            {optimisticSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 transition-transform group-hover:scale-110" />}
                            <span>{optimisticSaving ? 'Bezig...' : 'Activiteit aanmaken'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="btn-cancel"
                        >
                            <X className="size-4 text-text-muted" />
                            <span>Annuleren</span>
                        </button>
                    </div>
                </form>
            </div>
            <BeheerToast toast={toast} onClose={hideToast} />
        </div>
    );
}
