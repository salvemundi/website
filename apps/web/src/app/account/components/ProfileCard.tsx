"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { updateCurrentUserAction } from "@/shared/api/account-actions";
import { uploadFileAction } from "@/shared/api/file-actions";
import { getImageUrl } from "@/shared/lib/api/image";
import { slugify } from "@/shared/lib/utils/slug";
import { format } from "date-fns";
import {
    Upload,
    Loader2,
    Check,
    X,
    Users2,
} from "lucide-react";
import { User } from "@/shared/model/types/auth";
import AccountHeader from "./AccountHeader";

interface ProfileCardProps {
    initialUser: User;
}

export default function ProfileCard({ initialUser }: ProfileCardProps) {
    const router = useRouter();
    const { user: authUser, refreshUser } = useAuth();

    // Prefer the hydrated auth user over the initial server snapshot
    const user = authUser ?? initialUser;

    const fileInputRef = useMemo(() => ({ current: null as HTMLInputElement | null }), []);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const membershipStatus = useMemo(() => {
        if (!user) return null;

        const isLeader = user.committees?.some((c) => c.is_leader) ?? false;
        const isInCommittee = (user.committees?.length ?? 0) > 0;
        const isMember = user.is_member;
        const status = user.membership_status;

        let role = "Gebruiker";
        if (isLeader) role = "Commissie Leider";
        else if (isInCommittee) role = "Actief Lid";
        else if (isMember) role = "Lid";

        let statusText = "Geen Lidmaatschap";
        if (status === "active") statusText = "Lidmaatschap Actief";
        else if (status === "expired") statusText = "Lidmaatschap Verlopen";

        let color = "bg-slate-100 dark:bg-white/5 border border-theme-purple/20 text-theme-purple dark:text-white";
        let textColor = "text-theme-purple dark:text-white font-bold";

        if (status === "active") {
            if (isLeader) {
                color = "bg-gradient-to-r from-theme-purple to-theme-purple-light shadow-lg";
                textColor = "text-white";
            } else if (isInCommittee || isMember) {
                color = "bg-theme-purple shadow-lg";
                textColor = "text-white";
            }
        } else if (status === "expired") {
            color = "bg-red-500/80 shadow-lg";
            textColor = "text-white";
        }

        return { text: `${role} • ${statusText}`, color, textColor };
    }, [user]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleCancelAvatar = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleConfirmAvatar = async () => {
        if (!selectedFile || !user?.id) return;

        setIsUploadingAvatar(true);
        try {
            const fd = new FormData();
            fd.append("file", selectedFile);

            const uploadRes = await uploadFileAction(fd);
            if (!uploadRes.success) throw new Error(uploadRes.error);

            const fileId = uploadRes.data?.id || uploadRes.data;
            if (!fileId) throw new Error("No file ID returned");

            const updateRes = await updateCurrentUserAction({ avatar: fileId });
            if (!updateRes.success) throw new Error(updateRes.error);

            // Refresh auth state and tell Next.js to re-fetch server data
            await refreshUser();
            router.refresh();
            handleCancelAvatar();
        } catch (error: any) {
            console.error("Avatar upload failed:", error);
            alert(error.message || "Kon profielfoto niet bijwerken. Probeer het opnieuw.");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 items-center text-center">
            {/* Avatar */}
            <div className="relative group shrink-0">
                <input
                    type="file"
                    ref={(el) => { fileInputRef.current = el; }}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                />
                <div
                    className={`relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 shadow-lg transition-all ${previewUrl
                        ? "border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                        : "border-theme-purple/10"
                        }`}
                >
                    {previewUrl ? (
                        <>
                            <Image
                                src={previewUrl}
                                alt="Preview"
                                fill
                                sizes="128px"
                                className="object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-full h-full border-[12px] border-black/20 rounded-full" />
                            </div>
                            <div className="absolute bottom-1 left-0 right-0 text-center">
                                <span className="bg-green-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg">
                                    Voorvertoning
                                </span>
                            </div>
                        </>
                    ) : user.avatar ? (
                        <Image
                            src={getImageUrl(user.avatar)}
                            alt={`${user.first_name} ${user.last_name}`}
                            fill
                            sizes="128px"
                            className="object-cover"
                            priority
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "/img/avatar-placeholder.svg";
                            }}
                        />
                    ) : (
                        <div className="h-full w-full bg-theme-purple/5 flex items-center justify-center">
                            <span className="text-4xl font-bold text-theme-purple dark:text-white">
                                {user.first_name?.[0]}
                                {user.last_name?.[0]}
                            </span>
                        </div>
                    )}

                    {!previewUrl && (
                        <div
                            onClick={handleAvatarClick}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                        >
                            <Upload className="h-6 w-6 text-white" />
                        </div>
                    )}
                </div>

                {previewUrl ? (
                    <div className="absolute -bottom-2 flex gap-2 left-1/2 -translate-x-1/2">
                        <button
                            onClick={handleConfirmAvatar}
                            disabled={isUploadingAvatar}
                            className="h-9 w-9 rounded-full bg-green-500 text-white shadow-xl flex items-center justify-center border-2 border-white dark:border-surface-dark hover:scale-105 transition-transform"
                            title="Bevestigen"
                        >
                            {isUploadingAvatar ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4" />
                            )}
                        </button>
                        <button
                            onClick={handleCancelAvatar}
                            disabled={isUploadingAvatar}
                            className="h-9 w-9 rounded-full bg-red-500 text-white shadow-xl flex items-center justify-center border-2 border-white dark:border-surface-dark hover:scale-105 transition-transform"
                            title="Annuleren"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleAvatarClick}
                        disabled={isUploadingAvatar}
                        className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-theme-purple text-white shadow-xl flex items-center justify-center border-2 border-white dark:border-surface-dark sm:hidden"
                    >
                        <Upload className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Info */}
            <div className="min-w-0 w-full">
                <AccountHeader
                    firstName={user.first_name}
                    lastName={user.last_name}
                    email={user.email}
                />

                <div className="mt-4 flex flex-wrap justify-center">
                    {membershipStatus && (
                        <span
                            className={`px-6 py-2 ${membershipStatus.color} ${membershipStatus.textColor} text-[11px] font-black uppercase tracking-wider rounded-full shadow-md transition-all`}
                        >
                            {membershipStatus.text}
                        </span>
                    )}
                </div>

                {/* Commissies */}
                {user.committees && user.committees.length > 0 && (
                    <div className="mt-6">
                        <p className="text-[10px] text-theme-purple/60 dark:text-white/40 font-black uppercase tracking-wider mb-3 text-center">
                            Mijn Commissies
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {user.committees.map((committee) => (
                                <a
                                    key={committee.id}
                                    href={`/commissies/${slugify(committee.name)}`}
                                    className="group relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-theme-purple/10 to-theme-purple/5 dark:from-white/10 dark:to-white/5 border border-theme-purple/20 dark:border-white/20 rounded-full text-xs font-bold text-theme-purple dark:text-white hover:from-theme-purple/20 hover:to-theme-purple/10 dark:hover:from-white/20 dark:hover:to-white/10 transition-all hover:scale-105 shadow-sm hover:shadow-md"
                                >
                                    {committee.is_leader && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-white dark:border-surface-dark shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <span className="text-[8px]">⭐</span>
                                        </span>
                                    )}
                                    <Users2 className="h-3.5 w-3.5" />
                                    <span>
                                        {committee.name
                                            .replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, "")
                                            .trim()}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-3">
                    <div className="rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 px-5 py-4 shadow-sm">
                        <p className="text-[10px] text-theme-purple/60 dark:text-white/40 font-black uppercase tracking-wider mb-1.5">
                            Lidmaatschap tot
                        </p>
                        <p className="text-base font-bold text-theme-purple dark:text-white">
                            {user.membership_expiry
                                ? format(
                                    new Date(
                                        user.membership_expiry.includes("T") ||
                                            user.membership_expiry.includes(" ")
                                            ? user.membership_expiry
                                            : `${user.membership_expiry}T12:00:00`
                                    ),
                                    "d MMM yyyy"
                                )
                                : "N/A"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
