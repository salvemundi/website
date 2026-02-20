"use client";

import { useActionState, useEffect, useState } from "react";
import {
    updatePhoneAction,
    updateDateOfBirthAction,
    updateMinecraftAction
} from "@/shared/api/account-actions";
import { PhoneNumberInput } from "@/shared/components/PhoneNumberInput";
import { Gamepad2, Phone, X } from "lucide-react";
import { toast } from "sonner";

interface ProfileFormProps {
    user: any;
    refreshUser: () => Promise<void>;
}

export function PhoneNumberForm({ user, refreshUser }: ProfileFormProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState(user.phone_number || "");

    const [state, formAction, isPending] = useActionState(updatePhoneAction, null);

    useEffect(() => {
        if (state?.success) {
            toast.success("Telefoonnummer opgeslagen!");
            refreshUser();
            setIsEditing(false);
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state, refreshUser]);

    if (!isEditing) {
        return (
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-4">
                    <div className="shrink-0 rounded-xl bg-theme-purple/10 dark:bg-white/10 p-3 text-theme-purple dark:text-white shadow-sm">
                        <Phone className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[11px] font-bold uppercase text-theme-purple/70 dark:text-white/50 tracking-wide text-left mb-1">
                            Telefoonnummer
                        </p>
                        <p className="font-bold text-theme-purple dark:text-white text-sm">
                            {user.phone_number || "Niet ingesteld"}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setPhoneNumber(user.phone_number || "");
                        setIsEditing(true);
                    }}
                    className="shrink-0 rounded-xl bg-theme-purple px-3 py-1.5 text-[10px] font-bold uppercase text-white hover:bg-theme-purple-light transition shadow-md"
                >
                    {user.phone_number ? "Wijzig" : "Instellen"}
                </button>
            </div>
        );
    }

    return (
        <form action={formAction} className="mt-2">
            <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-[11px] font-bold uppercase text-theme-purple/70 dark:text-white/50 tracking-wide text-left">
                    <label htmlFor="phone_number">Telefoonnummer</label>
                </p>
            </div>

            <input type="hidden" name="phone_number" value={phoneNumber} />
            <PhoneNumberInput
                value={phoneNumber}
                onChange={(val) => setPhoneNumber(val || "")}
                disabled={isPending}
            />

            <div className="flex gap-2 mt-3">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-xl bg-theme-purple px-4 py-2 text-sm font-bold text-white hover:bg-theme-purple-light transition disabled:opacity-50"
                >
                    {isPending ? 'Opslaan...' : 'Opslaan'}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setIsEditing(false);
                        setPhoneNumber(user.phone_number || "");
                    }}
                    disabled={isPending}
                    className="flex-1 rounded-xl border border-theme-purple/20 px-4 py-2 text-sm font-bold text-theme-purple dark:text-white hover:bg-theme-purple/10 transition disabled:opacity-50"
                >
                    Annuleren
                </button>
            </div>
        </form>
    );
}

export function DateOfBirthForm({ user, refreshUser }: ProfileFormProps) {
    const [isEditing, setIsEditing] = useState(false);

    // Initial value formatted for standard <input type="date">
    const initialDate = user.date_of_birth ? user.date_of_birth.substring(0, 10) : "";
    const [dateOfBirth, setDateOfBirth] = useState(initialDate);

    const [state, formAction, isPending] = useActionState(updateDateOfBirthAction, null);

    useEffect(() => {
        if (state?.success) {
            toast.success("Geboortedatum opgeslagen!");
            refreshUser();
            setIsEditing(false);
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state, refreshUser]);

    if (!isEditing) {
        return (
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex flex-col">
                    <p className="text-[11px] font-bold uppercase text-theme-purple/70 dark:text-white/50 tracking-wide text-left mb-1">
                        Geboortedatum
                    </p>
                    <p className="font-bold text-theme-purple dark:text-white text-sm">
                        {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('nl-NL') : "Niet ingesteld"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setDateOfBirth(initialDate);
                        setIsEditing(true);
                    }}
                    className="shrink-0 rounded-xl bg-theme-purple px-3 py-1.5 text-[10px] font-bold uppercase text-white hover:bg-theme-purple-light transition shadow-md"
                >
                    {user.date_of_birth ? "Wijzig" : "Instellen"}
                </button>
            </div>
        );
    }

    return (
        <form action={formAction}>
            <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-[11px] font-bold uppercase text-theme-purple/70 dark:text-white/50 tracking-wide text-left">
                    <label htmlFor="date_of_birth">Geboortedatum</label>
                </p>
            </div>

            <div className="space-y-3">
                <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    autoComplete="bday"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full rounded-xl border border-theme-purple/20 bg-white dark:bg-surface-dark px-4 py-2.5 text-theme-purple dark:text-white focus:outline-none focus:ring-2 focus:ring-theme-purple/50 transition shadow-inner"
                    disabled={isPending}
                />
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 rounded-xl bg-theme-purple px-4 py-2 text-sm font-bold text-white hover:bg-theme-purple-light transition disabled:opacity-50"
                    >
                        {isPending ? 'Opslaan...' : 'Opslaan'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditing(false);
                            setDateOfBirth(initialDate);
                        }}
                        disabled={isPending}
                        className="flex-1 rounded-xl border border-theme-purple/20 px-4 py-2 text-sm font-bold text-theme-purple dark:text-white hover:bg-theme-purple/10 transition disabled:opacity-50"
                    >
                        Annuleren
                    </button>
                </div>
            </div>
        </form>
    );
}

export function MinecraftForm({ user, refreshUser }: ProfileFormProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [minecraftUsername, setMinecraftUsername] = useState(user.minecraft_username || "");

    const [state, formAction, isPending] = useActionState(updateMinecraftAction, null);

    useEffect(() => {
        if (state?.success) {
            toast.success("Minecraft username opgeslagen!");
            refreshUser();
            setIsEditing(false);
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state, refreshUser]);

    return (
        <>
            <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-[11px] font-bold uppercase text-theme-purple/70 dark:text-white/50 tracking-wide text-left">
                    <label htmlFor="minecraft_username">Minecraft Username</label>
                </p>
                {!isEditing && (
                    <button
                        type="button"
                        onClick={() => {
                            setMinecraftUsername(user.minecraft_username || "");
                            setIsEditing(true);
                        }}
                        className="shrink-0 rounded-xl bg-theme-purple px-3 py-1.5 text-[10px] font-bold uppercase text-white hover:bg-theme-purple-light transition shadow-md"
                    >
                        {user.minecraft_username ? "Wijzig" : "Instellen"}
                    </button>
                )}
            </div>

            {isEditing ? (
                <form action={formAction} className="flex flex-wrap gap-2">
                    <input
                        type="text"
                        id="minecraft_username"
                        name="minecraft_username"
                        autoComplete="nickname"
                        value={minecraftUsername}
                        onChange={(e) => setMinecraftUsername(e.target.value)}
                        className="flex-1 min-w-0 rounded-xl bg-white dark:bg-black/40 px-3.5 py-2 text-sm text-theme-purple dark:text-white outline-none focus:ring-2 focus:ring-theme-purple shadow-inner"
                        placeholder="Username"
                        disabled={isPending}
                    />
                    <button
                        type="submit"
                        disabled={isPending}
                        className="shrink-0 rounded-xl bg-theme-purple px-4 py-2 text-sm font-bold text-white hover:bg-theme-purple-light transition disabled:opacity-50 shadow-md"
                    >
                        {isPending ? "..." : "Save"}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditing(false);
                            setMinecraftUsername(user.minecraft_username || "");
                        }}
                        disabled={isPending}
                        className="shrink-0 rounded-xl bg-theme-purple/5 px-3 py-2 text-sm font-bold text-theme-purple dark:text-white border border-theme-purple/10"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </form>
            ) : (
                <div className="flex items-center gap-3 min-w-0">
                    <Gamepad2 className="h-5 w-5 text-theme-purple/40" />
                    <p
                        className="break-words font-bold text-theme-purple dark:text-white"
                        style={{ fontSize: 'var(--font-size-base)' }}
                    >
                        {user.minecraft_username || "Niet ingesteld"}
                    </p>
                </div>
            )}
        </>
    );
}
