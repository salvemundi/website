'use client';

import React, { useState, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stickersApi, calculateStickerStats, geocodeAddress, reverseGeocode, CreateStickerData, Sticker } from '@/lib/api/salvemundi';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { MapPin, Globe, Award, TrendingUp, Plus, X, Search, Loader2 } from 'lucide-react';
import PageHeader from '@/shared/components/ui/PageHeader';

// Dynamically import StickerMap with ssr: false
const StickerMap = dynamic(() => import('@/shared/components/stickers/StickerMap'), {
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
    });

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
        });
        setSelectedLocation(null);
        setSearchAddress('');
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.latitude || !formData.longitude || formData.latitude === 0 || formData.longitude === 0) {
            alert('Please select a location on the map or search for an address.');
            return;
        }
        createMutation.mutate(formData);
    };

    return (
        <div className="">
            <PageHeader
                title="Sticker World Map"
                backgroundImage="/img/backgrounds/stickers-banner.jpg" // Assuming a banner exists or use a default
            >
                <p className="text-lg sm:text-xl text-beige/90 max-w-3xl mx-auto mt-4">
                    See where our members have placed association stickers around the world!
                </p>
            </PageHeader>

            <div className="container mx-auto px-4 py-8">

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-3xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Total Stickers</p>
                                <p className="text-3xl font-bold text-paars mt-1">{stats.total}</p>
                            </div>
                            <MapPin className="w-12 h-12 text-paars opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Countries</p>
                                <p className="text-3xl font-bold text-paars mt-1">{stats.countries}</p>
                            </div>
                            <Globe className="w-12 h-12 text-blue-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Cities</p>
                                <p className="text-3xl font-bold text-paars mt-1">{stats.cities}</p>
                            </div>
                            <Award className="w-12 h-12 text-green-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Top Country</p>
                                <p className="text-xl font-bold text-paars mt-1">
                                    {stats.topCountry ? `${stats.topCountry.country} (${stats.topCountry.count})` : 'N/A'}
                                </p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-oranje opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Filters and Add Sticker Button */}
                {user && (
                    <div className="mb-6 flex justify-end">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-gradient-to-r from-oranje to-paars text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-oranje/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            Add Sticker Location
                        </button>
                    </div>
                )}

                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl shadow-md">
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
                            className="px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-paars focus:border-transparent"
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
                            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Map */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
                    {isLoading ? (
                        <div className="h-[600px] flex items-center justify-center">
                            <Loader2 className="w-12 h-12 animate-spin text-paars" />
                        </div>
                    ) : error ? (
                        <div className="h-[600px] flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-paars font-semibold mb-2">Failed to load stickers</p>
                                <p className="text-gray-600 text-sm">Please try refreshing the page</p>
                            </div>
                        </div>
                    ) : (
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
                    )}
                </div>

                {/* Contributors / Stats Panel */}
                <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">
                    <h2 className="text-2xl font-bold mb-4 text-paars">Leaderboard</h2>
                    {leaderboard.length === 0 ? (
                        <p className="text-sm text-gray-600">No contributors yet</p>
                    ) : (
                        <div className="max-h-96 overflow-y-auto pr-2">
                            <ol className="space-y-2">
                                {leaderboard.slice(0, 50).map((c, idx) => {
                                    const isMe = user && c.id === user.id;
                                    return (
                                        <li key={c.id} className={`flex items-center justify-between p-3 rounded-xl ${isMe ? 'bg-oranje/10' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx < 3 ? 'bg-geel text-paars' : 'bg-gray-200 text-gray-600'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-paars">{c.name}</div>
                                                    {/* <div className="text-xs text-gray-500">{c.id}</div> */}
                                                </div>
                                            </div>
                                            <div className="text-xl font-bold text-paars">{c.count}</div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    )}
                </div>

                {/* Recent Stickers */}
                <div className="bg-white rounded-3xl shadow-lg p-6 mt-8">
                    <h2 className="text-2xl font-bold mb-4 text-paars">Recent Sticker Locations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stickers.slice(0, 6).map((sticker) => (
                            <div key={sticker.id} className="rounded-xl p-4 hover:shadow-md transition-shadow">
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
                                        <h3 className="font-semibold text-paars">
                                            {sticker.location_name || 'Unknown Location'}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {sticker.city && sticker.country
                                                ? `${sticker.city}, ${sticker.country}`
                                                : sticker.city || sticker.country || 'Location not specified'}
                                        </p>
                                        {sticker.description && (
                                            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{sticker.description}</p>
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

            {/* Add Sticker Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white px-6 py-4 flex items-center justify-between z-10">
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Address
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchAddress}
                                        onChange={(e) => setSearchAddress(e.target.value)}
                                        placeholder="Enter an address, city, or landmark..."
                                        className="flex-1 px-4 py-2 rounded-lg focus:ring-2 focus:ring-paars focus:border-transparent"
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
                                        className="bg-paars hover:bg-paars/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isGeocoding ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Search className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Or click directly on the map to select a location
                                </p>
                            </div>

                            {/* Mini Map */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Location on Map
                                </label>
                                <div className="h-[300px] rounded-lg overflow-hidden">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Location Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location_name}
                                        onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                                        placeholder="e.g., Eiffel Tower"
                                        className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-paars focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Auto-filled or enter manually"
                                        className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-paars focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        placeholder="Auto-filled or enter manually"
                                        className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-paars focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Full address"
                                        className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-paars focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Any additional details about this sticker..."
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-paars focus:border-transparent"
                                />
                            </div>

                            {selectedLocation && (
                                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                    <p className="text-sm text-green-800">
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
                                    className="flex-1 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || !selectedLocation}
                                    className="flex-1 bg-gradient-to-r from-oranje to-paars text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-oranje/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
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
