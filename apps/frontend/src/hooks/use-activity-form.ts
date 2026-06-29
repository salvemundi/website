import { useState, useRef, useCallback, useEffect } from 'react';

export type ActivityStatus = 'published' | 'draft' | 'scheduled';

interface UseActivityFormProps {
    initialStatus?: ActivityStatus;
    initialOnlyMembers?: boolean;
    initialContactEmail?: string;
    initialImage?: string | { id: string; type?: string | null } | null;
    committees?: { id: number; name: string; email?: string | null }[];
}

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
    const [imagePreview, setImagePreview] = useState<{ id: string; type?: string | null } | null>(
        initialImage ? (typeof initialImage === 'string' ? { id: initialImage } : initialImage) : null
    );
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            let fileType = file.type;
            if (file.name) {
                const ext = file.name.toLowerCase().split('.').pop();
                if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) {
                    fileType = `video/${ext === 'mov' ? 'quicktime' : ext}`;
                }
            }
            
            const objectUrl = URL.createObjectURL(file);
            setImagePreview({ id: objectUrl, type: fileType });
        }
    }, []);

    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.id && imagePreview.id.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview.id);
            }
        };
    }, [imagePreview]);

    const handleRemoveImage = useCallback(() => {
        setImageFile(null);
        setImagePreview(null);
        setRemoveExistingImage(true);
    }, []);

    const handleCommitteeChange = useCallback((committeeId: string) => {
        const committee = committees.find(c => String(c.id) === committeeId);
        
        const isCurrentEmailACommitteeEmail = 
            !contactEmail || 
            contactEmail === 'info@salvemundi.nl' || 
            committees.some(c => c.email && c.email === contactEmail);
        
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
