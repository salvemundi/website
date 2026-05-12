'use client';

import { useOptimistic, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { createActivityAction } from '@/server/actions/events/activiteiten/activities-write.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

// Refactored Modules
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
    initialData?: Record<string, unknown>;
}

interface ActiviteitNieuwIslandProps {
    committees?: Committee[];
}

/**
 * ActiviteitNieuwIsland: Panel voor het aanmaken van een nieuwe activiteit.
 * Voldoet aan de Zero-Any Policy en Admin UI Standard.
 */
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
    const initialData = state.initialData as Record<string, unknown> | undefined;

    return (
        <div className="pb-20">
            <AdminToolbar
                title="Nieuwe activiteit"
                subtitle="Creëer een nieuwe activiteit voor de vereniging"
                backHref="/beheer/activiteiten"
            />
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <form action={formAction}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-8 space-y-6">
                            <GeneralInfoSection initialData={initialData} formErrors={state.fieldErrors} />
                            <PlanningLocationSection initialData={initialData} formErrors={state.fieldErrors} />
                            <CapacityCostsSection
                                initialData={initialData}
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
                            <StatusSection
                                status={status}
                                onStatusChange={(val) => setStatus(val as ActivityStatus)}
                                initialData={initialData}
                            />

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={optimisticSaving}
                                    className="w-full bg-[var(--beheer-accent)] text-white px-8 py-4 rounded-xl font-semibold text-base shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group border border-white/10"
                                >
                                    {optimisticSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                                    <span>{optimisticSaving ? 'Bezig...' : 'Activiteit aanmaken'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="w-full px-8 py-4 rounded-xl font-semibold text-base border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)] transition-all cursor-pointer"
                                >
                                    Annuleren
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}