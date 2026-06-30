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
        if (!file) return;

        if (file.size > 10 * 1024 * 1024 && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const scale = Math.min(1, 1920 / img.width);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                            setImageFile(compressedFile);
                            setImagePreview({ id: URL.createObjectURL(compressedFile), type: 'image/jpeg' });
                        }
                    }, 'image/jpeg', 0.8);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        } else {
            if (file.size > 10 * 1024 * 1024) {
                alert("Video bestanden groter dan 10MB kunnen niet worden geüpload. Gebruik een kleiner bestand of een link.");
                e.target.value = '';
                return;
            }
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
