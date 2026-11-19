import { useState, useEffect, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema } from '@salvemundi/validations/schema/profiel.zod';
import { updateUserProfile, uploadUserAvatar } from '@/server/actions/profile/profiel-update.actions';
import { z } from 'zod';
import { type ProfileViewDTO } from '@/server/actions/profile/profiel.actions';

const minecraftFormSchema = updateProfileSchema.pick({ minecraft_username: true });
const phoneFormSchema = updateProfileSchema.pick({ phone_number: true });

export type MinecraftFormData = z.infer<typeof minecraftFormSchema>;
export type PhoneFormData = z.infer<typeof phoneFormSchema>;

interface UseProfileStateProps {
    profile: ProfileViewDTO;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export function useProfileState({ profile, showToast }: UseProfileStateProps) {
    const router = useRouter();
    const [isEditingMinecraft, setIsEditingMinecraft] = useState(false);
    const [isEditingPhoneNumber, setIsEditingPhoneNumber] = useState(false);
    const [pendingAvatar, setPendingAvatar] = useState<{ file: File, preview: string } | null>(null);
    const [isPending, startUpdateTransition] = useTransition();

    const [optimisticProfile, addOptimisticUpdate] = useOptimistic(
        profile,
        (current, update: Partial<ProfileViewDTO>) => ({ ...current, ...update })
    );

    const minecraftForm = useForm<MinecraftFormData>({
        resolver: zodResolver(minecraftFormSchema),
        defaultValues: { minecraft_username: profile.minecraft_username || "" }
    });

    const phoneForm = useForm<PhoneFormData>({
        resolver: zodResolver(phoneFormSchema),
        defaultValues: { phone_number: profile.phone_number || "" }
    });

    useEffect(() => {
        minecraftForm.reset({ minecraft_username: profile.minecraft_username || "" });
        phoneForm.reset({ phone_number: profile.phone_number || "" });
    }, [profile, minecraftForm, phoneForm]);

    const onSaveMinecraft = (data: MinecraftFormData) => {
        startUpdateTransition(async () => {
            addOptimisticUpdate({ minecraft_username: data.minecraft_username ?? null });
            const result = await updateUserProfile(data);
            if (result.success) {
                router.refresh();
                showToast('Minecraft username succesvol bijgewerkt!', 'success');
                setIsEditingMinecraft(false);
            } else {
                showToast(result.error || 'Het bijwerken van je Minecraft username is mislukt.', 'error');
            }
        });
    };

    const onSavePhone = (data: PhoneFormData) => {
        startUpdateTransition(async () => {
            addOptimisticUpdate({ phone_number: data.phone_number ?? null });
            const result = await updateUserProfile(data);
            if (result.success) {
                router.refresh();
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
                router.refresh();
                showToast('Profielfoto succesvol bijgewerkt!', 'success');
            } else {
                showToast(result.error || 'Het uploaden van je profielfoto is mislukt.', 'error');
            }
            URL.revokeObjectURL(preview);
        });
    };

    return {
        optimisticProfile,
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
