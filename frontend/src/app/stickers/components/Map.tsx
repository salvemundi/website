'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo } from 'react';

// Fix for default marker icon in Leaflet with Next.js


// Custom marker icon
const customIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Icon for current logged-in user's pins (blue)
const currentUserIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click: (e) => {
            if (onLocationSelect) {
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

interface MapProps {
    stickers?: any[];
    user?: any;
    onLocationSelect?: (lat: number, lng: number) => void;
    selectedLocation?: { lat: number; lng: number } | null;
    center?: [number, number];
    zoom?: number;
    height?: string;
    filterCountry?: string;
    filterCity?: string;
    filterUser?: string;
    filterUserId?: string;
}

export default function StickerMap({
    stickers = [],
    user,
    onLocationSelect,
    selectedLocation,
    center = [51.5074, 0.1278],
    zoom = 2,
    height = '600px',
    filterCountry = '',
    filterCity = '',
    filterUser = '',
    filterUserId = ''
}: MapProps) {

    // Fix for Leaflet CSS issues in Next.js
    useEffect(() => {
        // This forces a resize event to ensure the map renders correctly if it was hidden
        window.dispatchEvent(new Event('resize'));
    }, []);

    // Prevent double-initialization in React Strict Mode by only rendering the
    // MapContainer after the component is mounted on the client.
    const [mounted, setMounted] = useState(false);
    
    // Generate a unique key for this map instance to force React to create a new
    // DOM element when the component remounts, preventing Leaflet from trying to
    // initialize on an already-initialized container.
    const mapKey = useMemo(() => `map-${Math.random().toString(36).substr(2, 9)}`, []);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div style={{ height, width: '100%' }} />;
    }

    const filteredStickers = stickers
        .filter(sticker => sticker.latitude != null && sticker.longitude != null)
        .filter(sticker => {
            // country filter
            if (filterCountry && !(sticker.country || '').toLowerCase().includes(filterCountry.toLowerCase())) return false;
            // city filter
            if (filterCity && !(sticker.city || '').toLowerCase().includes(filterCity.toLowerCase())) return false;
            // user filter (match created_by or user_created name/email)
            if (filterUserId) {
                const userObj = (sticker.created_by && typeof sticker.created_by !== 'string') ? sticker.created_by :
                    (sticker.user_created && typeof sticker.user_created !== 'string') ? sticker.user_created : null;
                const ownerId = userObj ? (userObj.id || userObj.email || '') : (typeof sticker.user_created === 'string' ? sticker.user_created : (typeof sticker.created_by === 'string' ? sticker.created_by : ''));
                if (ownerId !== filterUserId) return false;
            }
            // fallback free-text user search
            if (filterUser) {
                const userObj = (sticker.created_by && typeof sticker.created_by !== 'string') ? sticker.created_by :
                    (sticker.user_created && typeof sticker.user_created !== 'string') ? sticker.user_created : null;
                const hay = `${userObj ? `${userObj.first_name || ''} ${userObj.last_name || ''} ${userObj.email || ''}` : ''}`.toLowerCase();
                if (!hay.includes(filterUser.toLowerCase())) return false;
            }
            return true;
        });

    return (
        <MapContainer
            key={mapKey}
            center={center}
            zoom={zoom}
            style={{ height, width: '100%', borderRadius: '1rem', zIndex: 0 }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler onLocationSelect={onLocationSelect} />

            {/* Render existing stickers */}
            {filteredStickers.map((sticker) => {
                const userObj = (sticker.created_by && typeof sticker.created_by !== 'string') ? sticker.created_by :
                    (sticker.user_created && typeof sticker.user_created !== 'string') ? sticker.user_created : null;
                const ownerId = userObj ? (userObj.id || userObj.email || '') : (typeof sticker.user_created === 'string' ? sticker.user_created : (typeof sticker.created_by === 'string' ? sticker.created_by : ''));
                const isMine = user && ownerId && user.id === ownerId;

                return (
                    <Marker
                        key={sticker.id}
                        position={[sticker.latitude, sticker.longitude]}
                        icon={isMine ? currentUserIcon : customIcon}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <h3 className="font-bold text-lg mb-1 text-slate-900">
                                    {sticker.location_name || 'Sticker Location'}
                                </h3>
                                {sticker.city && <p className="text-sm text-slate-600">📍 {sticker.city}</p>}
                                {sticker.country && <p className="text-sm text-slate-600">🌍 {sticker.country}</p>}
                                {sticker.description && (
                                    <p className="text-sm mt-2 text-slate-700 italic">"{sticker.description}"</p>
                                )}
                                <p className="text-xs text-slate-400 mt-2 pt-2">
                                    {new Date(sticker.date_created).toLocaleDateString()}
                                </p>
                                {userObj && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Added by: <span className="font-medium">{userObj.first_name} {userObj.last_name}</span>
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {/* Render selected location marker */}
            {selectedLocation && (
                <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={customIcon} />
            )}
        </MapContainer>
    );
}
