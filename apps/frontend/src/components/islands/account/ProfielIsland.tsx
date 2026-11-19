'use client';

import React, { useState, useMemo } from 'react';
import { Grid, GridCol, Stack } from '@mantine/core';
import { type ProfileEventSignup } from '@salvemundi/validations/schema/profiel.zod';
import { type EnrichedPubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';
import { useAdminToast } from '@/hooks/use-beheer-toast';

import { filterProfileSignups } from '@/lib/profile/profile-admin.utils';
import { type ProfileViewDTO } from '@/server/actions/profile/profiel.actions';
import { useProfileState } from '@/hooks/use-profile-state';
import AvatarPreviewModal from './profile/AvatarPreviewModal';
import ProfielHeader from './profile/ProfielHeader';
import ProfielDetails from './profile/ProfielDetails';
import ProfielGaming from './profile/ProfielGaming';
import ProfielQuickLinks from './profile/ProfielQuickLinks';
import ProfielSignups from './profile/ProfielSignups';
import { type BorrelBarClaimStatus } from '@/server/actions/profile/borrelbar-claim.actions';

interface ProfielIslandProps {
    initialSignups?: ProfileEventSignup[];
    pubCrawlSignups?: EnrichedPubCrawlSignup[];
    borrelBarClaimStatus?: BorrelBarClaimStatus;
    profile: ProfileViewDTO;
}

export const ProfielIsland: React.FC<ProfielIslandProps> = ({
    initialSignups = [],
    pubCrawlSignups = [],
    borrelBarClaimStatus,
    profile
}) => {
    const { showToast } = useAdminToast();

    const {
        optimisticProfile,
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
    } = useProfileState({ profile, showToast });

    const [showPastEvents, setShowPastEvents] = useState(false);

    const filteredSignups = useMemo(() => {
        return filterProfileSignups(initialSignups, pubCrawlSignups, showPastEvents);
    }, [initialSignups, pubCrawlSignups, showPastEvents]);

    return (
        <>
            <Grid gap="lg" align="flex-start">
                <GridCol span={{ base: 12, lg: 4 }}>
                    <Stack gap="lg">
                        <ProfielHeader
                            user={{
                                ...optimisticProfile,
                                onAvatarChange
                            }}
                            membershipStatus={optimisticProfile.membershipBadge}
                        />
                        <ProfielGaming
                            user={optimisticProfile}
                            isEditingMinecraft={isEditingMinecraft}
                            setIsEditingMinecraft={setIsEditingMinecraft}
                            registerMinecraft={minecraftForm.register}
                            handleSubmitMinecraft={minecraftForm.handleSubmit}
                            onSaveMinecraft={onSaveMinecraft}
                            isPending={isPending}
                        />
                    </Stack>
                </GridCol>

                <GridCol span={{ base: 12, lg: 8 }}>
                    <Stack gap="lg">
                        <ProfielDetails
                            user={optimisticProfile}
                            borrelBarClaimStatus={borrelBarClaimStatus}
                            isEditingPhoneNumber={isEditingPhoneNumber}
                            setIsEditingPhoneNumber={setIsEditingPhoneNumber}
                            registerPhone={phoneForm.register}
                            handleSubmitPhone={phoneForm.handleSubmit}
                            onSavePhone={onSavePhone}
                            isPending={isPending}
                        />
                        <ProfielQuickLinks
                            user={optimisticProfile}
                        />
                    </Stack>
                </GridCol>

                <GridCol span={12}>
                    <ProfielSignups
                        filteredSignups={filteredSignups}
                        showPastEvents={showPastEvents}
                        setShowPastEvents={setShowPastEvents}
                    />
                </GridCol>
            </Grid>

            {pendingAvatar && (
                <AvatarPreviewModal
                    preview={pendingAvatar.preview}
                    isPending={isPending}
                    onConfirm={confirmAvatarUpload}
                    onCancel={cancelAvatarUpload}
                />
            )}
        </>
    );
};
