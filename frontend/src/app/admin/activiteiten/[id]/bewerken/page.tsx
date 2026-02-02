'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { useRouter, useParams } from 'next/navigation';
import { directusFetch } from '@/shared/lib/directus';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Save, ArrowLeft, Upload, X, ShieldAlert, Home } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Committee {
    id: number;
    name: string;
}

interface Event {
    id: number;
    name: string;
    description: string;
    description_logged_in?: string;
    event_date: string;
    event_time?: string;
    event_time_end?: string;
    location?: string;
    capacity?: number;
    price_members?: number;
    price_non_members?: number;
    inschrijf_deadline?: string;
    committee_id?: number;
    contact?: string;
    only_members?: boolean;
    image?: any;
    status?: 'published' | 'draft' | 'archived';
    publish_date?: string;
}

export default function BewerkenActiviteitPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params?.id as string;

    const auth = useAuth();

    const [committees, setCommittees] = useState<Committee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [currentImageId, setCurrentImageId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        description_logged_in: '',
        event_date: '',
        event_time: '',
        event_time_end: '',
        location: '',
        capacity: '',
        price_members: '',
        price_non_members: '',
        inschrijf_deadline: '',
        committee_id: '',
        contact: '',
        only_members: false,
        status: 'published' as 'published' | 'draft',
        publish_date: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    useEffect(() => {
        // Refresh when eventId or user changes
        loadData();
    }, [eventId, auth.user]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load committees and filter by user's memberships
            const committeesData = await directusFetch<Committee[]>('/items/committees?fields=id,name&sort=name&limit=-1&filter[is_visible][_eq]=true');
            try {
                const user = auth.user;
                const memberships = user?.committees || [];
                const hasPriv = memberships.some((c: any) => {
                    const name = (c?.name || '').toString().toLowerCase();
                    return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
                });
                if (hasPriv) {
                    setCommittees(committeesData);
                } else if (memberships.length > 0) {
                    const allowed = new Set(memberships.map((c: any) => String(c.id)));
                    setCommittees(committeesData.filter(c => allowed.has(String(c.id))));
                } else {
                    setCommittees([]);
                }
            } catch (e) {
                setCommittees([]);
            }

            // Load event
            const event = await directusFetch<Event>(`/items/events/${eventId}?fields=*`);

            // Parse date for input (needs YYYY-MM-DD format)
            const eventDate = event.event_date ? format(new Date(event.event_date), 'yyyy-MM-dd') : '';

            // Parse deadline for datetime-local input
            const deadline = event.inschrijf_deadline
                ? format(new Date(event.inschrijf_deadline), "yyyy-MM-dd'T'HH:mm")
                : '';

            // Parse publish_date for datetime-local input
            const publishDate = event.publish_date
                ? format(new Date(event.publish_date), "yyyy-MM-dd'T'HH:mm")
                : '';

            setFormData({
                name: event.name || '',
                description: event.description || '',
                description_logged_in: event.description_logged_in || '',
                event_date: eventDate,
                event_time: event.event_time || '',
                event_time_end: event.event_time_end || '',
                location: event.location || '',
                capacity: event.capacity ? String(event.capacity) : '',
                price_members: event.price_members !== undefined ? String(event.price_members) : '',
                price_non_members: event.price_non_members !== undefined ? String(event.price_non_members) : '',
                inschrijf_deadline: deadline,
                committee_id: event.committee_id ? String(event.committee_id) : '',
                contact: event.contact || '',
                only_members: event.only_members || false,
                status: (event.status === 'draft' ? 'draft' : 'published') as 'published' | 'draft',
                publish_date: publishDate,
            });

            // Check membership: only allow editing if user is member of event's committee
            try {
                const user = auth.user;
                if (user) {
                    const eventCommitteeId = event.committee_id ? String(event.committee_id) : null;
                    const memberships = user?.committees || [];

                    const isMember = eventCommitteeId ? memberships.some((c: any) => String(c.id) === eventCommitteeId) : false;
                    const hasPriv = memberships.some((c: any) => {
                        const name = (c?.name || '').toString().toLowerCase();
                        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
                    });

                    if (!(isMember || hasPriv)) {
                        setIsAuthorized(false);
                    }
                }
            } catch (e) {
                // handle unexpected auth object structure
            }

            // Set existing image if present
            if (event.image) {
                const imageId = typeof event.image === 'object' ? event.image.id : event.image;
                setCurrentImageId(imageId);
                setImagePreview(`/api/assets/${imageId}`);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            alert('Fout bij laden van activiteit');
            router.push('/admin/activiteiten');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
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
        setCurrentImageId(null);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Naam is verplicht';
        if (!formData.event_date) newErrors.event_date = 'Datum is verplicht';
        if (!formData.description.trim()) newErrors.description = 'Beschrijving is verplicht';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadImage = async (): Promise<string | null> => {
        if (!imageFile) return null;

        try {
            const formData = new FormData();
            formData.append('file', imageFile);

            // Upload via local proxy to avoid CORS issues
            const response = await fetch('/api/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload error response:', errorText);
                throw new Error('Image upload failed');
            }

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
            // Upload new image if present
            let imageId = currentImageId;
            if (imageFile) {
                imageId = await uploadImage();
            }

            // Prepare event data
            const eventData: any = {
                name: formData.name,
                description: formData.description,
                event_date: formData.event_date,
                location: formData.location || null,
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
                price_members: formData.price_members ? parseFloat(formData.price_members) : 0,
                price_non_members: formData.price_non_members ? parseFloat(formData.price_non_members) : 0,
                inschrijf_deadline: formData.inschrijf_deadline || null,
                committee_id: formData.committee_id ? parseInt(formData.committee_id) : null,
                contact: formData.contact || null,
                only_members: formData.only_members,
                image: imageId,
                status: formData.status,
                publish_date: formData.publish_date || null,
            };

            // Add optional fields
            if (formData.description_logged_in.trim()) {
                eventData.description_logged_in = formData.description_logged_in;
            }
            if (formData.event_time) {
                eventData.event_time = formData.event_time;
            }
            if (formData.event_time_end) {
                eventData.event_time_end = formData.event_time_end;
            }

            // Update event
            await directusFetch(`/items/events/${eventId}`, {
                method: 'PATCH',
                body: JSON.stringify(eventData)
            });

            showToast('Activiteit succesvol bijgewerkt!', 'success');
            setTimeout(() => router.push('/admin/activiteiten'), 1500);
        } catch (error) {
            console.error('Failed to update event:', error);
            showToast('Fout bij opslaan van activiteit', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <PageHeader
                    title="Activiteit Bewerken"
                    description="Laden..."
                />
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <div className="flex items-center justify-center py-20">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                    </div>
                </div>
            </>
        );
    }

    if (!isAuthorized) {
        return (
            <>
                <PageHeader
                    title="Geen Toegang"
                    description="Onvoldoende rechten"
                />
                <div className="container mx-auto px-4 py-12 max-w-2xl">
                    <div className="bg-admin-card rounded-3xl shadow-xl p-8 text-center ring-1 ring-admin-border">
                        <div className="mb-6 flex justify-center">
                            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-6">
                                <ShieldAlert className="h-16 w-16 text-red-600 dark:text-red-400" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-admin mb-4">
                            Toegang Geweigerd
                        </h1>

                        <p className="text-lg text-admin-muted mb-8">
                            Je hebt geen rechten om deze activiteit te bewerken. Dit kan alleen als je lid bent van de organiserende commissie, het bestuur of de ICT-commissie.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => router.back()}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-theme-purple hover:bg-theme-purple-dark text-white px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                Terug
                            </button>

                            <Link
                                href="/admin/activiteiten"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-admin-card text-admin-muted border-2 border-admin px-8 py-3 font-semibold hover:bg-admin-hover transition-all"
                            >
                                <Home className="h-5 w-5" />
                                Overzicht
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Activiteit Bewerken"
                description={formData.name}
            />

            <div className="container mx-auto px-4 py-8 max-w-4xl overflow-x-hidden">
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-white hover:text-white/80 transition"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Terug
                </button>

                <form onSubmit={handleSubmit} className="bg-admin-card rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
                    {/* Basic Info */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-bold text-admin-muted mb-2">
                            Naam *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-lg border bg-admin-card text-admin ${errors.name ? 'border-red-500' : 'border-admin'} focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition`}
                            placeholder="Bijv. Borrel: Back to School"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="event_date" className="block text-sm font-bold text-admin-muted mb-2">
                                Datum *
                            </label>
                            <input
                                type="date"
                                id="event_date"
                                name="event_date"
                                value={formData.event_date}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-lg border bg-admin-card text-admin ${errors.event_date ? 'border-red-500' : 'border-admin'} focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition`}
                            />
                            {errors.event_date && <p className="text-red-500 text-sm mt-1">{errors.event_date}</p>}
                        </div>

                        <div>
                            <label htmlFor="inschrijf_deadline" className="block text-sm font-bold text-admin-muted mb-2">
                                Inschrijfdeadline
                            </label>
                            <input
                                type="datetime-local"
                                id="inschrijf_deadline"
                                name="inschrijf_deadline"
                                value={formData.inschrijf_deadline}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-admin bg-admin-card text-admin focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="event_time" className="block text-sm font-bold text-admin-muted mb-2">
                                Starttijd
                            </label>
                            <input
                                type="time"
                                id="event_time"
                                name="event_time"
                                value={formData.event_time}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-admin bg-admin-card text-admin focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="event_time_end" className="block text-sm font-bold text-admin-muted mb-2">
                                Eindtijd
                            </label>
                            <input
                                type="time"
                                id="event_time_end"
                                name="event_time_end"
                                value={formData.event_time_end}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-admin bg-admin-card text-admin focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="location" className="block text-sm font-bold text-admin-muted mb-2">
                            Locatie
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-admin bg-admin-card text-admin focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                            placeholder="Bijv. R10 Building"
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
                            placeholder="Beschrijving van de activiteit"
                        />
                        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                    </div>

                    <div>
                        <label htmlFor="description_logged_in" className="block text-sm font-bold text-admin-muted mb-2">
                            Extra beschrijving voor ingelogde gebruikers
                        </label>
                        <textarea
                            id="description_logged_in"
                            name="description_logged_in"
                            value={formData.description_logged_in}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg border border-admin bg-admin-card text-admin focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                            placeholder="Extra informatie die alleen zichtbaar is voor ingelogde gebruikers"
                        />
                    </div>

                    {/* Capacity & Pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="capacity" className="block text-sm font-bold text-admin-muted mb-2">
                                Capaciteit
                            </label>
                            <input
                                type="number"
                                id="capacity"
                                name="capacity"
                                value={formData.capacity}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-4 py-3 rounded-lg border border-admin bg-admin-card text-admin focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                                placeholder="Max deelnemers"
                            />
                        </div>

                        <div>
                            <label htmlFor="price_members" className="block text-sm font-bold text-admin-muted mb-2">
                                Prijs Leden (€)
                            </label>
                            <input
                                type="number"
                                id="price_members"
                                name="price_members"
                                value={formData.price_members}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 rounded-lg border border-admin bg-admin-card text-admin focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label htmlFor="price_non_members" className="block text-sm font-bold text-admin-muted mb-2">
                                Prijs Niet-leden (€)
                            </label>
                            <input
                                type="number"
                                id="price_non_members"
                                name="price_non_members"
                                value={formData.price_non_members}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 rounded-lg border border-admin bg-admin-card text-admin focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Committee & Contact */}
                    <div>
                        <label htmlFor="committee_id" className="block text-sm font-bold text-admin-muted mb-2">
                            Commissie
                        </label>
                        <select
                            id="committee_id"
                            name="committee_id"
                            value={formData.committee_id}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-admin bg-admin-card text-admin focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                        >
                            <option value="">Selecteer een commissie...</option>
                            {committees.map(committee => (
                                <option key={committee.id} value={committee.id}>
                                    {committee.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="contact" className="block text-sm font-bold text-admin-muted mb-2">
                            Contact (email of telefoon)
                        </label>
                        <input
                            type="text"
                            id="contact"
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-admin bg-admin-card text-admin focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                            placeholder="naam@salvemundi.nl of +31 6 12345678"
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-bold text-admin-muted mb-2">
                            Afbeelding
                        </label>
                        {!imagePreview ? (
                            <label
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-admin rounded-lg cursor-pointer hover:border-theme-purple transition"
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
                                        onClick={() => window.open(imagePreview || '', '_blank')}
                                        className="bg-admin-card text-admin p-2 rounded-full hover:bg-admin-hover transition shadow"
                                        title="Bekijk afbeelding"
                                    >
                                        View
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-admin-card text-admin p-2 rounded-full hover:bg-admin-hover transition shadow"
                                        title="Wijzig afbeelding"
                                    >
                                        Change
                                    </button>
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                                        title="Verwijder afbeelding"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                        )}
                    </div>

                    {/* Publish Settings */}
                    <div className="border border-admin rounded-lg p-6 space-y-4 bg-admin-card-soft">
                        <h3 className="text-lg font-bold text-admin mb-4">Publicatie Instellingen</h3>
                        
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    value="published"
                                    checked={formData.status === 'published' && !formData.publish_date}
                                    onChange={() => setFormData({ ...formData, status: 'published', publish_date: '' })}
                                    className="w-4 h-4 text-theme-purple focus:ring-theme-purple"
                                />
                                <div>
                                    <div className="text-sm font-semibold text-admin">Direct gepubliceerd</div>
                                    <div className="text-xs text-admin-muted">Activiteit is zichtbaar</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    value="draft"
                                    checked={formData.status === 'draft'}
                                    onChange={() => setFormData({ ...formData, status: 'draft', publish_date: '' })}
                                    className="w-4 h-4 text-theme-purple focus:ring-theme-purple"
                                />
                                <div>
                                    <div className="text-sm font-semibold text-admin">Concept</div>
                                    <div className="text-xs text-admin-muted">Activiteit blijft verborgen</div>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    value="scheduled"
                                    checked={formData.status === 'published' && !!formData.publish_date}
                                    onChange={() => setFormData({ ...formData, status: 'published' })}
                                    className="w-4 h-4 text-theme-purple focus:ring-theme-purple mt-0.5"
                                />
                                <div className="flex-1">
                                    <div className="text-sm font-semibold text-admin mb-2">Plannen voor later</div>
                                    <input
                                        type="datetime-local"
                                        value={formData.publish_date}
                                        onChange={(e) => setFormData({ ...formData, status: 'published', publish_date: e.target.value })}
                                        onClick={(e) => {
                                            // Select the radio when clicking the datetime input
                                            const radio = (e.currentTarget.parentElement?.parentElement?.querySelector('input[type="radio"]') as HTMLInputElement);
                                            if (radio) radio.checked = true;
                                            setFormData({ ...formData, status: 'published' });
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-admin bg-admin-card text-admin text-sm focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                                        placeholder="Selecteer datum en tijd"
                                    />
                                    <div className="text-xs text-admin-muted mt-1">Activiteit wordt automatisch gepubliceerd op de gekozen datum/tijd</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Only Members */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="only_members"
                            name="only_members"
                            checked={formData.only_members}
                            onChange={handleChange}
                            className="w-5 h-5 text-theme-purple border-admin rounded focus:ring-theme-purple"
                        />
                        <label htmlFor="only_members" className="text-sm font-medium text-admin-muted">
                            Alleen voor leden
                        </label>
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
                                    Wijzigingen Opslaan
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
                        {toast.type === 'success' ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-medium">{toast.message}</span>
                    </div>
                </div>
            )}
        </>
    );
}
