import { useState, useRef, useCallback } from 'react';
import { getImageUrl } from '@/lib/utils/image-utils';

export type ActivityStatus = 'published' | 'draft' | 'scheduled';

interface UseActivityFormProps {
    initialStatus?: ActivityStatus;
    initialOnlyMembers?: boolean;
    initialContactEmail?: string;
    initialImage?: string | { id: string; type?: string | null } | null;
    committees?: { id: number; name: string; email?: string | null }[];
}

/**
 * Hook voor gedeelde logica in de Activiteit beheer formulieren.
 * Beheert afbeeldingen, status, en commissie-email logica.
 */
export function useActivityForm({
    initialStatus = 'published',
    initialOnlyMembers = false,
    initialContactEmail = '',
    initialImage = null,
    committees = []
}: UseActivityFormProps = {}) {
    const [status, setStatus] = useState<ActivityStatus>(initialStatus);
    const [onlyMembers, setOnlyMembers] = useState(initialOnlyMembers);
    const [contactEmail, setContactEmail] = useState(initialContactEmail);
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [removeExistingImage, setRemoveExistingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(getImageUrl(initialImage));
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setRemoveExistingImage(false);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    }, []);

    const handleRemoveImage = useCallback(() => {
        setImageFile(null);
        setImagePreview(null);
        setRemoveExistingImage(true);
    }, []);

    const handleCommitteeChange = useCallback((committeeId: string) => {
        const committee = committees.find(c => String(c.id) === committeeId);
        
        // Alleen invullen als het veld leeg is OF als de huidige waarde een commissie-email is
        const isCurrentEmailACommitteeEmail = !contactEmail || committees.some(c => c.email && c.email === contactEmail);
        
        if (isCurrentEmailACommitteeEmail) {
            if (committee?.email) {
                setContactEmail(committee.email);
            } else if (committeeId === '') {
                setContactEmail('info@salvemundi.nl');
            }
        }
    }, [committees, contactEmail]);

    return {
        status, setStatus,
        onlyMembers, setOnlyMembers,
        contactEmail, setContactEmail,
        imageFile, setImageFile,
        removeExistingImage, setRemoveExistingImage,
        imagePreview, setImagePreview,
        fileInputRef,
        handleImageChange,
        handleRemoveImage,
        handleCommitteeChange
    };
}
