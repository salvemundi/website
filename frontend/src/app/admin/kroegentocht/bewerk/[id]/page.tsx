'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { pubCrawlEventsApi } from '@/shared/lib/api/salvemundi';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Save, ArrowLeft, Upload, X, Loader2, Trash2 } from 'lucide-react';

export default function BewerkKroegentochtPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = parseInt(params.id as string);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Existing data
    const [existingImageId, setExistingImageId] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        date: '',
        email: '',
        description: '',
        association: 'Salve Mundi',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    useEffect(() => {
        if (!isNaN(eventId)) {
            loadEvent();
        }
    }, [eventId]);

    const loadEvent = async () => {
        setIsLoading(true);
        try {
            const data = await pubCrawlEventsApi.getById(eventId);
            setFormData({
                name: data.name || '',
                date: data.date || '',
                email: data.email || '',
                description: data.description || '',
                association: data.association || 'Salve Mundi',
            });
            if (data.image) {
                setExistingImageId(data.image);
                // Construct directly using the ID, though typically we'd use getImageUrl util. 
                // For preview we can assume standard assets endpoint if needed, or just rely on existing ID state logic.
                // Actually to show preview we need a URL.
                // Assuming `/assets/${data.image}` works as general Directus convention.
                setImagePreview(`/assets/${data.image}`);
            }
        } catch (err) {
            console.error('Failed to load event:', err);
            showToast('Fout bij laden van event', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setExistingImageId(null);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Naam is verplicht';
        if (!formData.date) newErrors.date = 'Datum is verplicht';
        if (!formData.email.trim()) newErrors.email = 'E-mail is verplicht';
        if (!formData.description.trim()) newErrors.description = 'Beschrijving is verplicht';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadImage = async (): Promise<string | null> => {
        if (!imageFile) return existingImageId; // Keep existing if no new file

        try {
            const formData = new FormData();
            formData.append('file', imageFile);

            const response = await fetch('/api/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Image upload failed');
            const result = await response.json();
            return result.data?.id || null;
        } catch (error) {
            console.error('Image upload error:', error);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Controleer de verplichte velden', 'error');
            return;
        }

        setIsSaving(true);

        try {
            let finalImageId = existingImageId;

            // If a new file is selected, upload it
            if (imageFile) {
                finalImageId = await uploadImage();
            } else if (existingImageId === null && imagePreview === null) {
                // Explicitly removed
                finalImageId = null;
            }

            const updateData = {
                name: formData.name,
                date: formData.date,
                email: formData.email,
                description: formData.description,
                association: formData.association,
                image: finalImageId,
            };

            await pubCrawlEventsApi.update(eventId, updateData);

            showToast('Kroegentocht event succesvol bijgewerkt!', 'success');
            setTimeout(() => router.push('/admin/kroegentocht'), 1500);
        } catch (error) {
            console.error('Failed to update event:', error);
            showToast('Fout bij bijwerken van event', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Weet je zeker dat je dit event wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;

        setIsSaving(true);
        try {
            await pubCrawlEventsApi.delete(eventId);
            showToast('Event verwijderd', 'success');
            setTimeout(() => router.push('/admin/kroegentocht'), 1000);
        } catch (err) {
            console.error('Failed to delete event:', err);
            showToast('Fout bij verwijderen', 'error');
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-theme-purple" />
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Bewerk Kroegentocht Event"
                description="Wijzig details van de kroegentocht"
                backgroundImage="/img/backgrounds/intro-banner.jpg"
            />

            <div className="container mx-auto px-4 py-8 max-w-4xl overflow-x-hidden">
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-white hover:text-white/80 transition"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Terug
                </button>

                <form onSubmit={handleSubmit} className="bg-admin-card rounded-2xl shadow-lg p-6 sm:p-8 space-y-6 text-admin">
                    {/* Basic Info */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-bold text-admin-muted mb-2">
                            Naam Event *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-lg border bg-admin-card text-admin ${errors.name ? 'border-red-500' : 'border-admin'} focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition`}
                            placeholder="Bijv. Halloween Kroegentocht"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="date" className="block text-sm font-bold text-admin-muted mb-2">
                                Datum *
                            </label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-lg border bg-admin-card text-admin ${errors.date ? 'border-red-500' : 'border-admin'} focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition`}
                            />
                            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-admin-muted mb-2">
                                Contact E-mail *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-lg border bg-admin-card text-admin ${errors.email ? 'border-red-500' : 'border-admin'} focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition`}
                                placeholder="kroegentocht@salvemundi.nl"
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="association" className="block text-sm font-bold text-admin-muted mb-2">
                            Organiserende Vereniging
                        </label>
                        <input
                            type="text"
                            id="association"
                            name="association"
                            value={formData.association}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border bg-admin-card text-admin border-admin focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                            placeholder="Salve Mundi"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-bold text-admin-muted mb-2">
                            Beschrijving *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={5}
                            className={`w-full px-4 py-3 rounded-lg border bg-admin-card text-admin ${errors.description ? 'border-red-500' : 'border-admin'} focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition`}
                            placeholder="Beschrijving van de kroegentocht..."
                        />
                        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-bold text-admin-muted mb-2">
                            Omslagfoto
                        </label>
                        {!imagePreview ? (
                            <label
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-admin rounded-lg cursor-pointer hover:border-theme-purple transition bg-admin-card text-admin-muted"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-8 w-8 text-admin-muted mb-2" />
                                <span className="text-sm text-admin-muted">Klik om een afbeelding te uploaden</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        ) : (
                            <div className="relative">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                                        title="Verwijder afbeelding"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4 justify-between">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-6 py-3 rounded-full font-semibold bg-red-500 text-white hover:bg-red-600 transition flex items-center justify-center gap-2"
                        >
                            <Trash2 className="h-5 w-5" />
                            Verwijderen
                        </button>

                        <div className="flex gap-4 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 rounded-full font-semibold border-2 border-white text-white hover:bg-white/10 transition"
                            >
                                Annuleren
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 sm:flex-none bg-theme-purple text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                        Opslaan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        Opslaan
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
                    <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                        <span className="font-medium">{toast.message}</span>
                    </div>
                </div>
            )}
        </>
    );
}
