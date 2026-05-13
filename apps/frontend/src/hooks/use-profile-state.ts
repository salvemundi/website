import { useState, useEffect, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema } from '@salvemundi/validations/schema/profiel.zod';
import { updateUserProfile, uploadUserAvatar } from '@/server/actions/profile/profiel-update.actions';
import { z } from 'zod';
import { type SessionUser } from '@/lib/profile-admin.utils';

// Zod validation schemas for forms
const minecraftFormSchema = updateProfileSchema.pick({ minecraft_username: true });
const phoneFormSchema = updateProfileSchema.pick({ phone_number: true });

export type MinecraftFormData = z.infer<typeof minecraftFormSchema>;
export type PhoneFormData = z.infer<typeof phoneFormSchema>;

interface UseProfileStateProps {
    user: SessionUser;
    refetch: () => Promise<unknown>;
    showToast: (message: string, type: 'success' | 'error') => void;
}

/**
 * Hook voor het beheren van profiel-gerelateerde state en acties.
 */
export function useProfileState({ user, refetch, showToast }: UseProfileStateProps) {
    const router = useRouter();
    const [isEditingMinecraft, setIsEditingMinecraft] = useState(false);
    const [isEditingPhoneNumber, setIsEditingPhoneNumber] = useState(false);
    const [pendingAvatar, setPendingAvatar] = useState<{ file: File, preview: string } | null>(null);
    const [isPending, startUpdateTransition] = useTransition();

    // Optimistic UI for instant feedback
    const [optimisticUser, addOptimisticUpdate] = useOptimistic(
        user,
        (current, update: Partial<SessionUser>) => ({ ...current, ...update })
    );

    // Form: Minecraft
    const minecraftForm = useForm<MinecraftFormData>({
        resolver: zodResolver(minecraftFormSchema),
        defaultValues: { minecraft_username: user?.minecraft_username || "" }
    });

    // Form: Phone
    const phoneForm = useForm<PhoneFormData>({
        resolver: zodResolver(phoneFormSchema),
        defaultValues: { phone_number: user?.phone_number || "" }
    });

    // Sync form values if user changes
    useEffect(() => {
        minecraftForm.reset({ minecraft_username: user?.minecraft_username || "" });
        phoneForm.reset({ phone_number: user?.phone_number || "" });
    }, [user, minecraftForm, phoneForm]);

    const onSaveMinecraft = (data: MinecraftFormData) => {
        startUpdateTransition(async () => {
            addOptimisticUpdate({ minecraft_username: data.minecraft_username });
            const result = await updateUserProfile(data);
            if (result.success) {
                router.refresh();
                await refetch();
                showToast('Minecraft username succesvol bijgewerkt!', 'success');
                setIsEditingMinecraft(false);
            } else {
                showToast(result.error || 'Het bijwerken van je Minecraft username is mislukt.', 'error');
            }
        });
    };

    const onSavePhone = (data: PhoneFormData) => {
        startUpdateTransition(async () => {
            addOptimisticUpdate({ phone_number: data.phone_number });
            const result = await updateUserProfile(data);
            if (result.success) {
                router.refresh();
                await refetch();
                showToast('Telefoonnummer succesvol bijgewerkt!', 'success');
                setIsEditingPhoneNumber(false);
            } else {
                showToast(result.error || 'Het bijwerken van je telefoonnummer is mislukt.', 'error');
            }
        });
    };

    const onAvatarChange = (file: File) => {
        const preview = URL.createObjectURL(file);
        setPendingAvatar({ file, preview });
    };

    const cancelAvatarUpload = () => {
        if (pendingAvatar) {
            URL.revokeObjectURL(pendingAvatar.preview);
            setPendingAvatar(null);
        }
    };

    const confirmAvatarUpload = () => {
        if (!pendingAvatar) return;
        const { file, preview } = pendingAvatar;

        startUpdateTransition(async () => {
            addOptimisticUpdate({ avatar: preview, image: preview });
            setPendingAvatar(null);
            
            const formData = new FormData();
            formData.append('file', file);
            
            const result = await uploadUserAvatar(formData);
            if (result.success) {
                await refetch();
                router.refresh();
                showToast('Profielfoto succesvol bijgewerkt!', 'success');
            } else {
                showToast(result.error || 'Het uploaden van je profielfoto is mislukt.', 'error');
            }
            URL.revokeObjectURL(preview);
        });
    };

    return {
        optimisticUser,
        isPending,
        isEditingMinecraft, setIsEditingMinecraft,
        isEditingPhoneNumber, setIsEditingPhoneNumber,
        pendingAvatar, setPendingAvatar,
        minecraftForm,
        phoneForm,
        onSaveMinecraft,
        onSavePhone,
        onAvatarChange,
        cancelAvatarUpload,
        confirmAvatarUpload
    };
}
