'use client';

import React from 'react';
import { useAuth, useAuthActions } from '@/features/auth/providers/auth-provider';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { formatActivityDateTime } from '@/shared/lib/activity-utils';
import { type MembershipUserData } from '@/components/islands/account/MembershipStatusIsland';

import ActiviteitGridCard from './card/ActiviteitGridCard';
import ActiviteitListCard from './card/ActiviteitListCard';

interface ActiviteitCardProps {
    id?: number | string;
    description?: string;
    short_description?: string | null;
    description_logged_in?: string;
    image?: string | { id: string; type?: string | null } | null;
    date?: string;
    endDate?: string;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    title?: string;
    price?: number | string;
    isPast?: boolean;
    onSignup?: (data: { title: string; date?: string; description: string; price: number }) => void;
    onShowDetails?: () => void;
    requiresLogin?: boolean;
    isSignedUp?: boolean;
    variant?: 'grid' | 'list';
    committeeName?: string;
    registrationDeadline?: string;
    contact?: string;
    onlyMembers?: boolean;
    serverTime?: string;
}

const ActiviteitCard: React.FC<ActiviteitCardProps> = ({
    description = '',
    short_description = null,
    image,
    title = 'Activiteit',
    date,
    endDate,
    startTime,
    endTime,
    location,
    price,
    isPast = false,
    onSignup,
    onShowDetails,
    requiresLogin = false,
    isSignedUp = false,
    variant = 'grid',
    committeeName,
    contact,
    registrationDeadline,
    onlyMembers = false,
    serverTime
}) => {
    const { toast, showToast, hideToast } = useAdminToast();
    const { isAuthenticated, user } = useAuth();
    const { login: loginWithMicrosoft } = useAuthActions();

    const alreadySignedUp = Boolean(isSignedUp);
    const isListVariant = variant === 'list';
    const now = serverTime ? new Date(serverTime) : new Date();
    const isDeadlinePassed = registrationDeadline ? new Date(registrationDeadline) < now : false;
    const cannotSignUp = alreadySignedUp || isDeadlinePassed;

    const handleSignupClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        const userData = user as unknown as MembershipUserData | undefined;
        if (onlyMembers && userData?.membership_status !== 'active') {
            if (!isAuthenticated) {
                const returnTo = window.location.pathname + window.location.search;
                localStorage.setItem('auth_return_to', returnTo);
                void loginWithMicrosoft();
            } else {
                showToast('Deze activiteit is alleen voor leden.', 'error');
            }
            return;
        }

        if (requiresLogin && !isAuthenticated) {
            const returnTo = window.location.pathname + window.location.search;
            localStorage.setItem('auth_return_to', returnTo);
            void loginWithMicrosoft();
            return;
        }

        onSignup?.({ title, date, description, price: Number(price) || 0 });
    };

    const safePrice = (Number(price) || 0).toFixed(2);

    const cleanCommitteeName = (name?: string) => {
        if (!name) return 'Algemene Activiteit';
        return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || name;
    };

    const committeeLabel = cleanCommitteeName(committeeName);

    const { displayDate, timeRange } = formatActivityDateTime(
        {
            event_date: date || '',
            event_date_end: endDate,
            event_time: startTime,
            event_time_end: endTime
        },
        variant
    );

    return (
        <>
            {isListVariant ? (
                <ActiviteitListCard
                    title={title}
                    image={image ?? null}
                    displayDate={displayDate}
                    timeRange={timeRange}
                    location={location ?? null}
                    description={description}
                    short_description={short_description}
                    safePrice={safePrice}
                    committeeLabel={committeeLabel}
                    onlyMembers={onlyMembers}
                    isPast={isPast}
                    cannotSignUp={cannotSignUp}
                    alreadySignedUp={alreadySignedUp}
                    isDeadlinePassed={isDeadlinePassed}
                    contact={contact}
                    handleSignupClick={handleSignupClick}
                    onShowDetails={onShowDetails}
                />
            ) : (
                <ActiviteitGridCard
                    title={title}
                    image={image ?? null}
                    displayDate={displayDate}
                    timeRange={timeRange}
                    description={description}
                    short_description={short_description}
                    safePrice={safePrice}
                    committeeLabel={committeeLabel}
                    onlyMembers={onlyMembers}
                    isPast={isPast}
                    cannotSignUp={cannotSignUp}
                    alreadySignedUp={alreadySignedUp}
                    handleSignupClick={handleSignupClick}
                    onShowDetails={onShowDetails}
                />
            )}
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
};

export default ActiviteitCard;
