import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAllStickers, createSticker, calculateStickerStats, geocodeAddress, reverseGeocode, CreateStickerData } from '../lib/stickers-api';
import { Sticker } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Globe, Award, TrendingUp, Plus, X, Search, Loader2 } from 'lucide-react';

// Custom marker icon
const customIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function StickersPagina() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterUser, setFilterUser] = useState('');
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
    queryFn: getAllStickers,
  });

  // Create sticker mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStickerData) => {
      const token = localStorage.getItem('auth_token');
      return createSticker(data, token || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stickers'] });
      setShowAddModal(false);
      resetForm();
      alert('Sticker location added successfully! 🎉');
    },
    onError: (error: any) => {
      console.error('Error adding sticker:', error);
      const errorMessage = error?.message || 'Failed to add sticker location. Please try again.';
      alert('❌ ' + errorMessage);
    },
  });

  const stats = calculateStickerStats(stickers);

  // Compute stickers per user (use created_by first, then user_created)
  const stickersPerUser = stickers.reduce<Record<string, { name: string; count: number }>>((acc, s) => {
    const user = (s.created_by && typeof s.created_by !== 'string') ? s.created_by :
                 (s.user_created && typeof s.user_created !== 'string') ? s.user_created : null;
    const uid = user ? (user.id || (user as any).email || 'unknown') : 'unknown';
    const display = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || uid : 'Unknown';
    if (!acc[uid]) acc[uid] = { name: display, count: 0 };
    acc[uid].count += 1;
    return acc;
  }, {});

  const topContributors = Object.entries(stickersPerUser)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

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

  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) return;

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

  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    // Reverse geocode to get address
    const details = await reverseGeocode(lat, lng);
    if (details) {
      setFormData(prev => ({
        ...prev,
        address: details.display_name,
        city: details.city || '',
        country: details.country || '',
      }));
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

      <div className="container mx-auto px-4 py-8 mt-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🌍 Sticker World Map
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See where our members have placed association stickers around the world!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Stickers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <MapPin className="w-12 h-12 text-red-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Countries</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.countries}</p>
              </div>
              <Globe className="w-12 h-12 text-blue-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Cities</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.cities}</p>
              </div>
              <Award className="w-12 h-12 text-green-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Top Country</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {stats.topCountry ? `${stats.topCountry.country} (${stats.topCountry.count})` : 'N/A'}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Filters and Add Sticker Button */}
        {user && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Sticker Location
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Filter by country"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="px-3 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Filter by city"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="px-3 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Filter by user (name or email)"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-3 py-2 border rounded"
          />
          <button
            onClick={() => { setFilterCountry(''); setFilterCity(''); setFilterUser(''); }}
            className="px-3 py-2 border rounded bg-gray-100"
          >
            Clear filters
          </button>
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-8">
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-red-600" />
            </div>
          ) : error ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-600 font-semibold mb-2">Failed to load stickers</p>
                <p className="text-gray-600 text-sm">Please try refreshing the page</p>
              </div>
            </div>
          ) : stickers.length === 0 ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-700 mb-2">No stickers yet!</p>
                <p className="text-gray-600">Be the first to add a sticker location</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={[51.5074, 0.1278]}
              zoom={2}
              style={{ height: '600px', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {stickers
                .filter(sticker => sticker.latitude != null && sticker.longitude != null)
                .filter(sticker => {
                  // country filter
                  if (filterCountry && !(sticker.country || '').toLowerCase().includes(filterCountry.toLowerCase())) return false;
                  // city filter
                  if (filterCity && !(sticker.city || '').toLowerCase().includes(filterCity.toLowerCase())) return false;
                  // user filter (match created_by or user_created name/email)
                  if (filterUser) {
                    const user = (sticker.created_by && typeof sticker.created_by !== 'string') ? sticker.created_by :
                      (sticker.user_created && typeof sticker.user_created !== 'string') ? sticker.user_created : null;
                    const hay = `${user ? `${user.first_name || ''} ${user.last_name || ''} ${user.email || ''}` : ''}`.toLowerCase();
                    if (!hay.includes(filterUser.toLowerCase())) return false;
                  }
                  return true;
                })
                .map((sticker) => (
                  <Marker
                    key={sticker.id}
                    position={[sticker.latitude!, sticker.longitude!]}
                    icon={customIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-lg mb-1">
                          {sticker.location_name || 'Sticker Location'}
                        </h3>
                        {sticker.city && <p className="text-sm text-gray-600">📍 {sticker.city}</p>}
                        {sticker.country && <p className="text-sm text-gray-600">🌍 {sticker.country}</p>}
                        {sticker.description && (
                          <p className="text-sm mt-2">{sticker.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Added: {new Date(sticker.date_created).toLocaleDateString()}
                        </p>
                        {sticker.user_created && (
                          <p className="text-xs text-gray-500 mt-1">
                            Added by: {typeof sticker.user_created === 'string'
                              ? sticker.user_created
                              : `${sticker.user_created.first_name || ''} ${sticker.user_created.last_name || ''}`.trim() || sticker.user_created.email || 'Unknown'}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))
              }
            </MapContainer>
          )}
        </div>

          {/* Contributors / Stats Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-2xl font-bold mb-4">Top Contributors</h2>
            {topContributors.length === 0 ? (
              <p className="text-sm text-gray-600">No contributors yet</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {topContributors.map(c => (
                  <li key={c.id} className="flex justify-between border p-2 rounded">
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.id}</p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-xl font-bold text-gray-800">{c.count}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        {/* Recent Stickers */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Sticker Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stickers.slice(0, 6).map((sticker) => (
              <div key={sticker.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {sticker.location_name || 'Unknown Location'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {sticker.city && sticker.country
                        ? `${sticker.city}, ${sticker.country}`
                        : sticker.city || sticker.country || 'Location not specified'}
                    </p>
                    {sticker.description && (
                      <p className="text-sm text-gray-700 mt-2">{sticker.description}</p>
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Add Sticker Location</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
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
                <div className="h-[300px] rounded-lg overflow-hidden border border-gray-300">
                  <MapContainer
                    center={selectedLocation || [51.5074, 0.1278]}
                    zoom={selectedLocation ? 13 : 2}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    <MapClickHandler onLocationSelect={handleMapClick} />
                    {selectedLocation && (
                      <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={customIcon} />
                    )}
                  </MapContainer>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {selectedLocation && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
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
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !selectedLocation}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
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
