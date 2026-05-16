'use client';

import React, { useMemo, useState } from 'react';
import { authClient } from '@/lib/auth';
import { type EventSignup } from '@salvemundi/validations/schema/profiel.zod';
import { type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

// Refactored Modules
import { 
    mergeUserData, 
    calculateMembershipStatus, 
    filterProfileSignups, 
    type SessionUser 
} from '@/lib/profile/profile-admin.utils';
import { useProfileState } from '@/hooks/use-profile-state';
import AvatarPreviewModal from './profile/AvatarPreviewModal';

import ProfielHeader from './profile/ProfielHeader';
import ProfielDetails from './profile/ProfielDetails';
import ProfielGaming from './profile/ProfielGaming';
import ProfielQuickLinks from './profile/ProfielQuickLinks';
import ProfielSignups from './profile/ProfielSignups';

interface ProfielIslandProps {
    initialSignups?: EventSignup[];
    pubCrawlSignups?: PubCrawlSignup[];
    user?: SessionUser;
}

/**
 * ProfielIsland: Centraal dashboard voor gebruikersprofielen.
 * Nu onder de 300 regels door extractie van logica en componenten.
 */
export const ProfielIsland: React.FC<ProfielIslandProps> = ({ 
    initialSignups = [], 
    pubCrawlSignups = [], 
    user: initialUser = {} as SessionUser 
}) => {
    const { toast, showToast, hideToast } = useAdminToast();
    const { data: session, refetch } = authClient.useSession();

    // 1. User Data Syncing
    const user = useMemo<SessionUser>(() => {
        return mergeUserData(session?.user as SessionUser, initialUser);
    }, [session?.user, initialUser]);
    
    // 2. Profile Actions & State Hook
    const {
        optimisticUser,
        isPending,
        isEditingMinecraft, setIsEditingMinecraft,
        isEditingPhoneNumber, setIsEditingPhoneNumber,
        pendingAvatar,
        minecraftForm,
        phoneForm,
        onSaveMinecraft,
        onSavePhone,
        onAvatarChange,
        cancelAvatarUpload,
        confirmAvatarUpload
    } = useProfileState({ user, refetch, showToast });

    // 3. UI State
    const [showPastEvents, setShowPastEvents] = useState(false);

    // 4. Derived Values
    const filteredSignups = useMemo(() => {
        return filterProfileSignups(initialSignups, pubCrawlSignups, showPastEvents);
    }, [initialSignups, pubCrawlSignups, showPastEvents]);

    const membershipStatus = useMemo(() => {
        return calculateMembershipStatus(optimisticUser);
    }, [optimisticUser]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column */}
            <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-6">
                <ProfielHeader 
                    user={{ 
                        ...optimisticUser, 
                        committees: (optimisticUser.committees || []).map(c => ({
                            ...c,
                            name: c.name || 'Onbekende Commissie',
                            is_leader: !!c.is_leader
                        })), 
                        onAvatarChange 
                    }} 
                    membershipStatus={membershipStatus} 
                />
                <ProfielGaming 
                    user={optimisticUser}
                    isEditingMinecraft={isEditingMinecraft}
                    setIsEditingMinecraft={setIsEditingMinecraft}
                    registerMinecraft={minecraftForm.register}
                    handleSubmitMinecraft={minecraftForm.handleSubmit}
                    onSaveMinecraft={onSaveMinecraft}
                    resetMinecraft={minecraftForm.reset}
                    minecraftErrors={minecraftForm.formState.errors}
                    isPending={isPending}
                />
            </div>

            {/* Right Column */}
            <div className="md:col-span-12 lg:col-span-8 flex flex-col gap-6">
                <ProfielDetails 
                    user={optimisticUser}
                    isEditingPhoneNumber={isEditingPhoneNumber}
                    setIsEditingPhoneNumber={setIsEditingPhoneNumber}
                    registerPhone={phoneForm.register}
                    handleSubmitPhone={phoneForm.handleSubmit}
                    onSavePhone={onSavePhone}
                    resetPhone={phoneForm.reset}
                    phoneErrors={phoneForm.formState.errors}
                    isPending={isPending}
                />
                <ProfielQuickLinks 
                    user={optimisticUser}
                    canAccessAdmin={!!(optimisticUser.isAdmin || optimisticUser.isICT)}
                    isICT={!!optimisticUser.isICT}
                />
            </div>

            {/* Bottom Column: Signups */}
            <div className="md:col-span-12">
                <ProfielSignups 
                    filteredSignups={filteredSignups}
                    showPastEvents={showPastEvents}
                    setShowPastEvents={setShowPastEvents}
                />
            </div>
            
            <AdminToast toast={toast} onClose={hideToast} />

            {/* Avatar Preview Modal */}
            {pendingAvatar && (
                <AvatarPreviewModal 
                    preview={pendingAvatar.preview}
                    isPending={isPending}
                    onConfirm={confirmAvatarUpload}
                    onCancel={cancelAvatarUpload}
                />
            )}
        </div>
    );
};