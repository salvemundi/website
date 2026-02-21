"use client";

import { useCallback } from "react";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useRouter } from "next/navigation";
import { PhoneNumberForm, DateOfBirthForm, MinecraftForm } from "../profile-forms";
import { User } from "@/shared/model/types/auth";

interface ProfileFormsWrapperProps {
    user: User;
    /** Which individual form to render */
    variant: "phone" | "dob" | "gaming";
}

/**
 * ProfileFormsWrapper — Client Island
 *
 * Bridges the Server Component page.tsx with the "use client" profile forms.
 * Retrieves `refreshUser` from the auth hook, threads it into forms,
 * and calls router.refresh() to re-sync server state after a successful save.
 *
 * IMPORTANT: handleRefresh is wrapped in useCallback to keep a stable reference.
 * The profile forms use `refreshUser` as a useEffect dependency — an unstable
 * reference would cause an infinite re-render loop.
 */
export default function ProfileFormsWrapper({ user, variant }: ProfileFormsWrapperProps) {
    const { user: authUser, refreshUser } = useAuth();
    const router = useRouter();

    // Prefer the hydrated auth user for the most current field values
    const liveUser = authUser ?? user;

    // Stable callback — prevents infinite loop in profile-forms useEffect deps
    const handleRefresh = useCallback(async () => {
        await refreshUser();
        router.refresh();
    }, [refreshUser, router]);

    if (variant === "gaming") {
        return <MinecraftForm user={liveUser} refreshUser={handleRefresh} />;
    }

    if (variant === "dob") {
        return <DateOfBirthForm user={liveUser} refreshUser={handleRefresh} />;
    }

    // variant === "phone"
    return <PhoneNumberForm user={liveUser} refreshUser={handleRefresh} />;
}
