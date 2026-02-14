'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { pubCrawlEventsApi } from '@/shared/lib/api/salvemundi';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Save, ArrowLeft, Upload, X } from 'lucide-react';

export default function NieuweKroegentochtPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        date: '',
        email: '',
        description: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
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
        if (!imageFile) return null;

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
            let imageId = null;
            if (imageFile) {
                imageId = await uploadImage();
            }

            const eventData = {
                name: formData.name,
                date: formData.date,
                email: formData.email,
                description: formData.description,
                image: imageId,
            };

            await pubCrawlEventsApi.create(eventData);

            showToast('Kroegentocht event succesvol aangemaakt!', 'success');
            setTimeout(() => router.push('/admin/kroegentocht'), 1500);
        } catch (error) {
            console.error('Failed to create event:', error);
            showToast('Fout bij aanmaken van event', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Nieuw Kroegentocht Event"
                description="Maak een nieuwe kroegentocht aan"
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

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-theme-purple text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                    Opslaan...
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    Event Aanmaken
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 rounded-full font-semibold border-2 border-white text-white hover:bg-white/10 transition"
                        >
                            Annuleren
                        </button>
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
