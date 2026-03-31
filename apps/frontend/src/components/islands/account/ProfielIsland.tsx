'use client';

import React, { useMemo, useState, useEffect, useOptimistic, useTransition } from 'react';
import { startOfDay, isBefore } from 'date-fns';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import type { EventSignup } from '@salvemundi/validations';
import { updateProfileSchema } from '@salvemundi/validations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUserProfile } from '@/server/actions/profiel-update.actions';
import { z } from 'zod';

import ProfielHeader from './profile/ProfielHeader';
import ProfielDetails from './profile/ProfielDetails';
import ProfielGaming from './profile/ProfielGaming';
import ProfielQuickLinks from './profile/ProfielQuickLinks';
import ProfielSignups from './profile/ProfielSignups';

type CommitteeMeta = {
    id?: string | number;
    name?: string | null;
    is_leader?: boolean | null;
};

type SessionUser = {
    id?: string | number;
    name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    fontys_email?: string | null;
    membership_status?: string | null;
    membership_expiry?: string | null;
    phone_number?: string | null;
    date_of_birth?: string | null;
    avatar?: string | null;
    image?: string | null;
    minecraft_username?: string | null;
    committees?: CommitteeMeta[] | null;
    isAdmin?: boolean;
    isLeader?: boolean;
    isICT?: boolean;
};

interface ProfielIslandProps {
    initialSignups: EventSignup[];
    pubCrawlSignups: any[];
    user: SessionUser;
    impersonation?: { 
        name: string; 
        avatar?: string | null; 
        email?: string | null;
        error?: string;
    } | null;
}

export const ProfielIsland: React.FC<ProfielIslandProps> = ({ initialSignups, pubCrawlSignups, user: initialUser }) => {
    const [mounted, setMounted] = useState(false);
    const { data: session, refetch } = authClient.useSession();

    const user = useMemo<SessionUser>(() => {
        const sUser = session?.user as SessionUser;
        
        if (!mounted || !sUser) return initialUser;

        // Enrich name if missing on client
        if (!sUser.name && (sUser.first_name || sUser.last_name)) {
            sUser.name = `${sUser.first_name || ''} ${sUser.last_name || ''}`.trim();
        }
        
        // Merge committees from initialUser if missing in session
        if (!sUser.committees && initialUser?.committees) {
            return { ...sUser, committees: initialUser.committees };
        }
        
        return sUser;
    }, [mounted, session?.user, initialUser]);
    
    const router = useRouter();

    // Hydratatie fix
    useEffect(() => {
        setMounted(true);
    }, []);

    const [eventSignups] = useState<EventSignup[]>(initialSignups || []);
    const [showPastEvents, setShowPastEvents] = useState(false);

    // Profile editing states
    const [isEditingMinecraft, setIsEditingMinecraft] = useState(false);
    const [isEditingPhoneNumber, setIsEditingPhoneNumber] = useState(false);
    const [isPending, startUpdateTransition] = useTransition();

    // React 19 useOptimistic for instant UI feedback
    const [optimisticUser, addOptimisticUpdate] = useOptimistic(
        user,
        (current, update: Partial<SessionUser>) => ({ ...current, ...update })
    );

    // Zod validation schemas for forms
    const minecraftFormSchema = updateProfileSchema.pick({ minecraft_username: true });
    const phoneFormSchema = updateProfileSchema.pick({ phone_number: true });

    type MinecraftFormData = z.infer<typeof minecraftFormSchema>;
    type PhoneFormData = z.infer<typeof phoneFormSchema>;

    const {
        register: registerMinecraft,
        handleSubmit: handleSubmitMinecraft,
        reset: resetMinecraft,
        formState: { errors: minecraftErrors }
    } = useForm<MinecraftFormData>({
        resolver: zodResolver(minecraftFormSchema),
        defaultValues: {
            minecraft_username: user?.minecraft_username || ""
        }
    });

    const {
        register: registerPhone,
        handleSubmit: handleSubmitPhone,
        reset: resetPhone,
        formState: { errors: phoneErrors }
    } = useForm<PhoneFormData>({
        resolver: zodResolver(phoneFormSchema),
        defaultValues: {
            phone_number: user?.phone_number || ""
        }
    });

    // Update form values if user changes
    useEffect(() => {
        resetMinecraft({ minecraft_username: user?.minecraft_username || "" });
        resetPhone({ phone_number: user?.phone_number || "" });
    }, [user, resetMinecraft, resetPhone]);

    const onSaveMinecraft = (data: MinecraftFormData) => {
        startUpdateTransition(async () => {
            // Step 1: Trigger optimistic update
            addOptimisticUpdate({ minecraft_username: data.minecraft_username });
            
            // Step 2: Trigger server action
            const result = await updateUserProfile(data);
            
            if (result.success) {
                router.refresh();
                await refetch();
                setIsEditingMinecraft(false);
            } else {
                alert(result.error || 'Het bijwerken van je Minecraft username is mislukt.');
            }
        });
    };

    const onSavePhone = (data: PhoneFormData) => {
        startUpdateTransition(async () => {
            // Step 1: Trigger optimistic update
            addOptimisticUpdate({ phone_number: data.phone_number });
            
            // Step 2: Trigger server action
            const result = await updateUserProfile(data);
            
            if (result.success) {
                router.refresh();
                await refetch();
                setIsEditingPhoneNumber(false);
            } else {
                alert(result.error || 'Het bijwerken van je telefoonnummer is mislukt.');
            }
        });
    };
    
    // Derived values
    const isCommitteeMember = Array.isArray(optimisticUser.committees) && optimisticUser.committees.length > 0;
    
    const filteredSignups = useMemo(() => {
        const todayStart = startOfDay(new Date());
        
        // Merge regular signups and pub crawl signups
        const allSignups = [
            ...(eventSignups || []).map(s => ({ ...s, _type: 'event' as const })),
            ...(pubCrawlSignups || []).map(s => ({ ...s, _type: 'pub_crawl' as const }))
        ];

        if (showPastEvents) return allSignups;

        return allSignups.filter((s: any) => {
            try {
                let eventDate;
                if (s._type === 'event') {
                    if (!s?.event_id?.event_date) return true;
                    eventDate = startOfDay(new Date(s.event_id.event_date));
                } else {
                    if (!s?.pub_crawl_event_id?.date) return true;
                    eventDate = startOfDay(new Date(s.pub_crawl_event_id.date));
                }
                return !isBefore(eventDate, todayStart);
            } catch {
                return true;
            }
        });
    }, [eventSignups, pubCrawlSignups, showPastEvents]);

    const membershipStatus = useMemo(() => {
        const isLeader = !!optimisticUser.isLeader;
        const isAdmin = !!optimisticUser.isAdmin;
        const isInCommittee = isCommitteeMember;
        const status = optimisticUser.membership_status;
        const isMember = status === 'active';

        let role = "Gebruiker";
        if (isAdmin) {
            const isBestuur = !!optimisticUser.committees?.some(c => c.name?.toLowerCase().includes('bestuur'));
            const isICTMember = !!optimisticUser.isICT;
            if (isBestuur) role = "Beheerder";
            else if (isICTMember) role = "ICT-commissie";
            else role = "Beheerder";
        }
        else if (isLeader) role = "Commissie Leider";
        else if (isInCommittee) role = "Actief Lid";
        else if (isMember) role = "Lid";

        let statusText = "Geen Lidmaatschap";
        if (status === "active") statusText = "Lidmaatschap Actief";
        else if (status === "expired") statusText = "Lidmaatschap Verlopen";

        let color = "bg-slate-100 dark:bg-white/5 border border-[var(--color-purple-200)] text-[var(--color-purple-700)] dark:text-white";
        let textColor = "text-[var(--color-purple-700)] dark:text-white font-bold";

        if (status === "active") {
            if (isAdmin || isLeader) {
                color = "bg-gradient-to-r from-[var(--color-purple-500)] to-[var(--color-purple-400)] shadow-lg";
                textColor = "text-white";
            } else if (isInCommittee || isMember) {
                color = "bg-[var(--color-purple-500)] shadow-lg";
                textColor = "text-white";
            }
        } else if (status === "expired") {
            color = "bg-red-500/80 shadow-lg";
            textColor = "text-white";
        }

        return { text: `${role} • ${statusText}`, color, textColor };
    }, [optimisticUser, isCommitteeMember]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column */}
            <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-6">
                <ProfielHeader user={optimisticUser} membershipStatus={membershipStatus} />
                <ProfielGaming 
                    user={optimisticUser}
                    isEditingMinecraft={isEditingMinecraft}
                    setIsEditingMinecraft={setIsEditingMinecraft}
                    registerMinecraft={registerMinecraft}
                    handleSubmitMinecraft={handleSubmitMinecraft}
                    onSaveMinecraft={onSaveMinecraft}
                    resetMinecraft={resetMinecraft}
                    minecraftErrors={minecraftErrors}
                    isPending={isPending}
                />
            </div>

            {/* Right Column */}
            <div className="md:col-span-12 lg:col-span-8 flex flex-col gap-6">
                <ProfielDetails 
                    user={optimisticUser}
                    isEditingPhoneNumber={isEditingPhoneNumber}
                    setIsEditingPhoneNumber={setIsEditingPhoneNumber}
                    registerPhone={registerPhone}
                    handleSubmitPhone={handleSubmitPhone}
                    onSavePhone={onSavePhone}
                    resetPhone={resetPhone}
                    phoneErrors={phoneErrors}
                    isPending={isPending}
                />
                <ProfielQuickLinks 
                    user={optimisticUser}
                    isCommitteeMember={isCommitteeMember}
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
        </div>
    );
};
