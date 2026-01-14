'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stickersApi, calculateStickerStats, geocodeAddress, reverseGeocode, CreateStickerData, Sticker } from '@/shared/lib/api/salvemundi';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { MapPin, Globe, Award, TrendingUp, Plus, X, Search, Loader2 } from 'lucide-react';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { stripHtml } from '@/shared/lib/text';

// Dynamically import StickerMap with ssr: false
const StickerMap = dynamic(() => import('@/entities/sticker/ui/StickerMap'), {
    ssr: false,
    loading: () => (
        <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
            <Loader2 className="w-12 h-12 animate-spin text-paars" />
        </div>
    ),
});

function StickersContent() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFullscreenMap, setShowFullscreenMap] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [searchAddress, setSearchAddress] = useState('');
    const [filterCountry, setFilterCountry] = useState('');
    const [filterCity, setFilterCity] = useState('');
    // filter by free-text (name/email) or by selecting a specific user id
    const [filterUser, setFilterUser] = useState('');
    const [filterUserId, setFilterUserId] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);

    // Form state
    const [formData, setFormData] = useState<CreateStickerData>({
        latitude: 0,
        longitude: 0,
        location_name: '',
        description: '',
        address: '',
        city: '',
        country: '',
        image: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Fetch stickers
    const { data: stickers = [], isLoading, error } = useQuery<Sticker[]>({
        queryKey: ['stickers'],
        queryFn: stickersApi.getAll,
    });

    const resetForm = () => {
        setFormData({
            latitude: 0,
            longitude: 0,
            location_name: '',
            description: '',
            address: '',
            city: '',
            country: '',
            image: '',
        });
        setSelectedLocation(null);
        setSearchAddress('');
        setImageFile(null);
        setImagePreview(null);
    };

    // Create sticker mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateStickerData) => stickersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stickers'] });
            setShowAddModal(false);
            resetForm();
            alert('Sticker location added successfully! 🎉');
        },
        onError: (error: any) => {
            console.error('Error adding sticker:', error);
            const msg = error?.message || 'Failed to add sticker location. Please try again.';
            alert('❌ ' + msg);
        },
    });





    // Calculate stats
    const stats = useMemo(() => calculateStickerStats(stickers), [stickers]);

    // Compute stickers per user (use created_by first, then user_created)
    const stickersPerUser = useMemo(() => {
        return stickers.reduce<Record<string, { name: string; count: number }>>((acc, s) => {
            const userObj = (s.created_by && typeof s.created_by !== 'string') ? s.created_by :
                (s.user_created && typeof s.user_created !== 'string') ? s.user_created : null;
            const uid = userObj ? (userObj.id || (userObj as any).email || 'unknown') : 'unknown';
            const display = userObj ? `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() || userObj.email || uid : 'Unknown';
            if (!acc[uid]) acc[uid] = { name: display, count: 0 };
            acc[uid].count += 1;
            return acc;
        }, {});
    }, [stickers]);

    // Leaderboard (all contributors sorted)
    const leaderboard = useMemo(() => {
        return Object.entries(stickersPerUser)
            .map(([id, v]) => ({ id, ...v }))
            .sort((a, b) => b.count - a.count);
    }, [stickersPerUser]);

    // Users list for people filter (used for the mobile people search)
    const usersList = useMemo(() => {
        return Object.entries(stickersPerUser).map(([id, info]) => ({ id, name: info.name || id }));
    }, [stickersPerUser]);

    // Recent stickers: sort by creation date (newest first) and take the last 5
    const recentStickers = useMemo<Sticker[]>(() => {
        return [...stickers]
            .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
            .slice(0, 6);
    }, [stickers]);

    // Handlers
    const handleMapClick = async (lat: number, lng: number) => {
        if (!user) return; // Only allow adding if logged in

        setSelectedLocation({ lat, lng });
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        setShowAddModal(true);

        // Reverse geocode
        const addressData = await reverseGeocode(lat, lng);
        if (addressData) {
            setFormData(prev => ({
                ...prev,
                address: addressData.display_name,
                city: addressData.city || '',
                country: addressData.country || '',
                location_name: addressData.city ? `Sticker in ${addressData.city}` : 'Nieuwe Sticker',
            }));
        }
    };

    const handleSearchAddress = async () => {
        if (!searchAddress) return;
        setIsGeocoding(true);
        const result = await geocodeAddress(searchAddress);
        setIsGeocoding(false);

        if (result) {
            setSelectedLocation({ lat: result.lat, lng: result.lon });
            setFormData(prev => ({
                ...prev,
                latitude: result.lat,
                longitude: result.lon,
                address: result.display_name,
                location_name: searchAddress,
            }));
            // Get city and country
            const details = await reverseGeocode(result.lat, result.lon);
            if (details) {
                setFormData(prev => ({
                    ...prev,
                    city: details.city || '',
                    country: details.country || '',
                }));
            }
        } else {
            alert('Address not found. Please try a different search or click on the map.');
        }
    };

    // Prevent background/body scrolling when the fullscreen mobile map is open
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const html = document.documentElement;
        const body = document.body;
        // Prevent background scrolling when either the fullscreen map or add modal is open
        if (showFullscreenMap || showAddModal) {
            html.classList.add('overflow-hidden');
            body.classList.add('overflow-hidden');
        } else {
            html.classList.remove('overflow-hidden');
            body.classList.remove('overflow-hidden');
        }

        return () => {
            html.classList.remove('overflow-hidden');
            body.classList.remove('overflow-hidden');
        };
    }, [showFullscreenMap, showAddModal]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setImageFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        handleImageChange(e);
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Get auth token from localStorage
            let authToken = '';
            try {
                if (typeof window !== 'undefined') {
                    authToken = localStorage.getItem('auth_token') || '';
                }
            } catch (e) {
                console.error('Could not access localStorage', e);
            }

            const headers: HeadersInit = {};
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            const response = await fetch('/api/files', {
                method: 'POST',
                body: formData,
                headers,
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const data = await response.json();
            return data.data?.id || null;
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.latitude || !formData.longitude || formData.latitude === 0 || formData.longitude === 0) {
            alert('Please select a location on the map or search for an address.');
            return;
        }

        let imageId = null;
        if (imageFile) {
            imageId = await uploadImage(imageFile);
            if (!imageId) {
                // Image upload failed, but we can still continue without it
                const continueWithout = confirm('Image upload failed. Do you want to continue without the image?');
                if (!continueWithout) return;
            }
        }

        const dataToSubmit = { ...formData };
        if (imageId) {
            dataToSubmit.image = imageId;
        }

        createMutation.mutate(dataToSubmit);
    };

    return (
        <div className="">
            <PageHeader
                title="Stickers"
            >
                <p className="text-lg sm:text-xl text-beige/90 max-w-3xl mx-auto mt-4">
                    Zie waar onze leden stickers hebben geplakt, of voeg je eigen locatie toe!
                </p>
            </PageHeader>

            <div className="container mx-auto px-4 py-8">

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                    <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs md:text-sm font-medium">Total Stickers</p>
                                <p className="text-2xl md:text-3xl font-bold text-paars mt-1">{stats.total}</p>
                            </div>
                            <MapPin className="w-8 h-8 md:w-12 md:h-12 text-paars opacity-80" />
                        </div>
                    </div>

                    <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs md:text-sm font-medium">Countries</p>
                                <p className="text-2xl md:text-3xl font-bold text-paars mt-1">{stats.countries}</p>
                            </div>
                            <Globe className="w-8 h-8 md:w-12 md:h-12 text-blue-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs md:text-sm font-medium">Cities</p>
                                <p className="text-2xl md:text-3xl font-bold text-paars mt-1">{stats.cities}</p>
                            </div>
                            <Award className="w-8 h-8 md:w-12 md:h-12 text-green-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs md:text-sm font-medium">Top Country</p>
                                <p className="text-base md:text-xl font-bold text-paars mt-1">
                                    {stats.topCountry ? `${stats.topCountry.country} (${stats.topCountry.count})` : 'N/A'}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 md:w-12 md:h-12 text-oranje opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Mobile: Button to show map fullscreen + Add button */}
                <div className="md:hidden mb-6 flex gap-3">
                    <button
                        onClick={() => setShowFullscreenMap(true)}
                        className="flex-1 bg-white dark:bg-[var(--bg-card)] text-paars px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md border-2 border-paars/30 hover:border-paars/50 hover:bg-paars/5 transition-all"
                    >
                        <MapPin className="w-5 h-5" />
                        View Map
                    </button>
                    {user && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-gradient-to-r from-oranje to-paars text-white btn-add-sticker px-4 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            Add
                        </button>
                    )}
                </div>

                {/* Desktop: Add Sticker Button */}
                {user && (
                    <div className="hidden md:flex mb-6 justify-end">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-gradient-to-r from-oranje to-paars text-theme-white btn-add-sticker px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-oranje/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            Add Sticker Location
                        </button>
                    </div>
                )}

                {/* Filters - Hidden on mobile, shown on desktop */}
                <div className="hidden md:grid mb-6 grid-cols-1 md:grid-cols-4 gap-3 bg-[var(--bg-card)] p-4 rounded-2xl shadow-md">
                    <input
                        type="text"
                        placeholder="Filter by country"
                        value={filterCountry}
                        onChange={(e) => setFilterCountry(e.target.value)}
                        className="px-3 py-2 rounded-lg focus:ring-2 focus:ring-paars focus:border-transparent"
                    />
                    <input
                        type="text"
                        placeholder="Filter by city"
                        value={filterCity}
                        onChange={(e) => setFilterCity(e.target.value)}
                        className="px-3 py-2 rounded-lg focus:ring-2 focus:ring-paars focus:border-transparent"
                    />
                    {/* User filter: select to filter by specific user, fallback free-text search still supported */}
                    <div className="flex">
                        <select
                            value={filterUserId}
                            onChange={(e) => setFilterUserId(e.target.value)}
                            className="px-3 py-2 rounded-lg w-full bg-[var(--bg-card)] focus:ring-2 focus:ring-paars focus:border-transparent"
                        >
                            <option value="">All users</option>
                            {Object.entries(stickersPerUser).map(([id, info]) => (
                                <option key={id} value={id}>{info.name || id} ({info.count})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Search user..."
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="px-3 py-2 rounded-lg flex-1 focus:ring-2 focus:ring-paars focus:border-transparent"
                        />
                        <button
                            onClick={() => { setFilterCountry(''); setFilterCity(''); setFilterUser(''); setFilterUserId(''); }}
                            className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-soft)] dark:bg-[var(--bg-soft-dark)] dark:hover:bg-[var(--bg-card-dark)] text-paars"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Map - Hidden on mobile, shown on desktop */}
                <div className="hidden md:block bg-[var(--bg-card)] rounded-3xl shadow-xl overflow-hidden mb-8 relative">
                    {/* Purple gradient banner behind the top of the map */}
                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-theme-purple-darker to-theme-purple z-0" />
                    {isLoading ? (
                        <div className="h-[600px] flex items-center justify-center">
                            <Loader2 className="w-12 h-12 animate-spin text-paars" />
                        </div>
                    ) : error ? (
                        <div className="h-[600px] flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-paars font-semibold mb-2">Failed to load stickers</p>
                                <p className="text-theme-muted text-sm">Please try refreshing the page</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10">
                            <StickerMap
                                stickers={stickers}
                                user={user}
                                filterCountry={filterCountry}
                                filterCity={filterCity}
                                filterUserId={filterUserId}
                                filterUser={filterUser}
                                onLocationSelect={handleMapClick}
                                selectedLocation={selectedLocation}
                            />
                            {/* Floating Add Button on Desktop Map */}
                            {user && (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="absolute bottom-6 right-6 bg-gradient-to-r from-oranje to-paars text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 z-[1000] border-2 border-white"
                                    title="Add Sticker Location"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Contributors / Stats Panel */}
                <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 mt-6">
                    <h2 className="text-xl md:text-2xl font-bold mb-4 text-paars">Leaderboard</h2>
                    {leaderboard.length === 0 ? (
                        <p className="text-sm text-theme-muted">No contributors yet</p>
                    ) : (
                        <div className="max-h-96 overflow-y-auto pr-2">
                            <ol className="space-y-2">
                                {leaderboard.slice(0, 50).map((c, idx) => {
                                    const isMe = user && c.id === user.id;
                                    return (
                                        <li key={c.id} className={`flex items-center justify-between p-3 rounded-xl ${isMe ? 'bg-oranje/10' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx < 3 ? 'bg-geel text-paars' : 'bg-[var(--bg-soft)] text-theme-muted'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-paars text-sm md:text-base">{c.name}</div>
                                                    {/* <div className="text-xs text-gray-500">{c.id}</div> */}
                                                </div>
                                            </div>
                                            <div className="text-lg md:text-xl font-bold text-paars">{c.count}</div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    )}
                </div>

                {/* Recent Stickers */}
                <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 mt-6 md:mt-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-4 text-paars">Recent Sticker Locations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentStickers.map((sticker) => (
                            <div key={sticker.id} className="rounded-xl p-4 hover:shadow-md transition-shadow bg-[var(--bg-soft)] dark:bg-[var(--bg-card)]">
                                <div className="flex items-start gap-3">
                                    {/* small pin: blue if current user's sticker */}
                                    {(() => {
                                        const userObj = (sticker.created_by && typeof sticker.created_by !== 'string') ? sticker.created_by :
                                            (sticker.user_created && typeof sticker.user_created !== 'string') ? sticker.user_created : null;
                                        const ownerId = userObj ? (userObj.id || (userObj as any).email || '') : (typeof sticker.user_created === 'string' ? sticker.user_created : (typeof sticker.created_by === 'string' ? sticker.created_by : ''));
                                        const isMine = user && ownerId && user.id === ownerId;
                                        return <MapPin className={`w-5 h-5 ${isMine ? 'text-blue-500' : 'text-paars'} flex-shrink-0 mt-1`} />;
                                    })()}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-paars text-sm md:text-base">
                                            {sticker.location_name || 'Unknown Location'}
                                        </h3>
                                        <p className="text-xs md:text-sm text-gray-600">
                                            {sticker.city && sticker.country
                                                ? `${sticker.city}, ${sticker.country}`
                                                : sticker.city || sticker.country || 'Location not specified'}
                                        </p>
                                        {sticker.description && (
                                            <p className="text-xs md:text-sm text-gray-700 mt-2 line-clamp-2">{stripHtml(sticker.description)}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">
                                            {new Date(sticker.date_created).toLocaleDateString()}
                                        </p>
                                        {sticker.user_created && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Added by: {typeof sticker.user_created === 'string'
                                                    ? sticker.user_created
                                                    : `${sticker.user_created.first_name || ''} ${sticker.user_created.last_name || ''}`.trim() || sticker.user_created.email || 'Unknown'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fullscreen Map Modal for Mobile */}
            {showFullscreenMap && (
                <div className="fixed inset-0 bg-[var(--bg-card)] z-[9999] flex flex-col pt-16 mobile-map-fullscreen">
                    {/* Header - floating over map */}
                    <div className="absolute top-16 left-0 right-0 flex items-center justify-between p-4 bg-[var(--bg-card)]/95 backdrop-blur-sm z-[1002] shadow-md">
                        <h2 className="text-lg font-bold text-paars">Sticker Map</h2>
                        <button
                            onClick={() => setShowFullscreenMap(false)}
                            className="text-theme-muted hover:text-paars transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* mobile filters are shown as an overlay inside the map (see below) */}

                    {/* Map - full screen */}
                    {/* Floating action buttons (moved here so they are above the MapLibre layers) */}
                    <div className="absolute bottom-6 left-6 z-[10050] flex flex-col gap-3">
                        {user && (
                            <button
                                onClick={() => {
                                    setShowFullscreenMap(false);
                                    setShowAddModal(true);
                                }}
                                className="bg-gradient-to-r from-oranje to-paars text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95 border-2 border-white"
                                title="Add Sticker Location"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        )}

                        <button
                            onClick={() => setMobileFiltersOpen((v) => !v)}
                            className="bg-paars text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95 border-2 border-white"
                            title="Filters"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 w-full h-full relative">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-12 h-12 animate-spin text-paars" />
                            </div>
                        ) : error ? (
                            <div className="h-full flex items-center justify-center p-4">
                                <div className="text-center">
                                    <p className="text-paars font-semibold mb-2">Failed to load stickers</p>
                                    <p className="text-theme-muted text-sm">Please try refreshing the page</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full w-full">
                                <StickerMap
                                    stickers={stickers}
                                    user={user}
                                    filterCountry={filterCountry}
                                    filterCity={filterCity}
                                    filterUserId={filterUserId}
                                    filterUser={filterUser}
                                    onLocationSelect={handleMapClick}
                                    selectedLocation={selectedLocation}
                                    height="100%"
                                />
                                {/* Floating action buttons on Mobile Map - stacked bottom to top: Add button (bottom), Filter button (above) */}
                                

                                {/* Filters overlay */}
                                {mobileFiltersOpen && (
                                    <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[94%] max-w-md bg-white dark:bg-[var(--bg-card)] rounded-2xl shadow-2xl p-4 z-[1100]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="font-semibold text-paars">Filters</div>
                                            <button onClick={() => setMobileFiltersOpen(false)} className="text-theme-muted">Close</button>
                                        </div>
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Filter by country"
                                                value={filterCountry}
                                                onChange={(e) => setFilterCountry(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-paars focus:border-transparent text-sm"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Filter by city"
                                                value={filterCity}
                                                onChange={(e) => setFilterCity(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-paars focus:border-transparent text-sm"
                                            />
                                            {/* People filter as text search */}
                                            <div>
                                                <label className="text-xs text-theme-muted">People</label>
                                                <input
                                                    type="text"
                                                    placeholder="Search users..."
                                                    value={filterUser}
                                                    onChange={(e) => { setFilterUser(e.target.value); setFilterUserId(''); }}
                                                    className="w-full px-3 py-2 mt-1 rounded-lg border border-gray-200 focus:ring-2 focus:ring-paars focus:border-transparent text-sm"
                                                />
                                                {filterUser && (
                                                    <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-gray-100 bg-white">
                                                        {usersList.filter(u => u.name.toLowerCase().includes(filterUser.toLowerCase())).map(u => (
                                                            <button key={u.id} onClick={() => { setFilterUserId(u.id); setFilterUser(u.name); setMobileFiltersOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-paars/5">{u.name}</button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setFilterCountry(''); setFilterCity(''); setFilterUser(''); setFilterUserId(''); setMobileFiltersOpen(false); }}
                                                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-soft)] text-paars font-medium text-sm"
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    onClick={() => setMobileFiltersOpen(false)}
                                                    className="flex-1 px-3 py-2 rounded-lg bg-paars text-white font-medium text-sm"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Sticker Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] pt-20">
                    <div className="bg-white dark:bg-[var(--bg-card)] rounded-3xl max-w-4xl w-full max-h-[calc(100vh-6rem)] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white dark:bg-[var(--bg-card)] px-6 py-4 flex items-center justify-between z-10 border-b border-gray-200 dark:border-[var(--border-color)]">
                            <h2 className="text-2xl font-bold text-paars">Add Sticker Location</h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    resetForm();
                                }}
                                className="text-gray-500 hover:text-paars transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {/* Address Search */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Search Address
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchAddress}
                                        onChange={(e) => setSearchAddress(e.target.value)}
                                        placeholder="Enter an address, city, or landmark..."
                                        className="flex-1 min-w-0 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-paars focus:border-transparent"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSearchAddress();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearchAddress}
                                        disabled={isGeocoding}
                                        className="bg-paars text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 dark:bg-gradient-to-r dark:from-oranje dark:to-paars"
                                    >
                                        {isGeocoding ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Search className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Or click directly on the map to select a location
                                </p>
                            </div>

                            {/* Mini Map */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Location on Map
                                </label>
                                <div className="h-[300px] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                                    <StickerMap
                                        center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [51.5074, 0.1278]}
                                        zoom={selectedLocation ? 13 : 2}
                                        height="100%"
                                        onLocationSelect={handleMapClick}
                                        selectedLocation={selectedLocation}
                                    />
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Location Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location_name}
                                        onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                                        placeholder="e.g., Eiffel Tower"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-paars focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Auto-filled or enter manually"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-paars focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        placeholder="Auto-filled or enter manually"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-paars focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Full address"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-paars focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Any additional details about this sticker..."
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-paars focus:border-transparent"
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Proof Image (Optional)
                                </label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <label className="flex-1 cursor-pointer">
                                            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-paars text-white rounded-lg hover:opacity-90 transition-opacity dark:bg-gradient-to-r dark:from-oranje dark:to-paars">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                Upload
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                        <label className="flex-1 cursor-pointer">
                                            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Take Photo
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handleCameraCapture}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                    {imagePreview && (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedLocation && (
                                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-800 dark:text-green-300">
                                        ✓ Location selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || !selectedLocation}
                                    className="flex-1 bg-paars text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed dark:bg-gradient-to-r dark:from-oranje dark:to-paars"
                                >
                                    {createMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Sticker'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom styles for mobile fullscreen map */}
            <style jsx global>{`
                /* Push MapLibre top-right controls below the header and below our floating buttons */
                .mobile-map-fullscreen .maplibregl-ctrl-top-right {
                    top: 96px !important; /* navbar (64px) + header bar (~32px) */
                    z-index: 1100 !important; /* below our buttons (10050) but above the map layers */
                    pointer-events: auto !important;
                }

                /* Ensure the control buttons are large enough to tap */
                .mobile-map-fullscreen .maplibregl-ctrl button {
                    min-width: 40px;
                    min-height: 40px;
                }
            `}</style>

        </div>
    );
}

export default function StickersPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-paars text-xl font-semibold">Laden...</div>
            </div>
        }>
            <StickersContent />
        </Suspense>
    );
}
