'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Sticker } from '@/lib/api/salvemundi';


// Fix for Leaflet default icon not showing
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon.src,
    iconRetinaUrl: markerIcon2x.src,
    shadowUrl: markerShadow.src,
});

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

interface StickerMapProps {
    stickers?: Sticker[];
    user?: any;
    onLocationSelect?: (lat: number, lng: number) => void;
    selectedLocation?: { lat: number; lng: number } | null;
    filterCountry?: string;
    filterCity?: string;
    filterUserId?: string;
    filterUser?: string;
    height?: string;
    zoom?: number;
    center?: [number, number];
}

const StickerMap: React.FC<StickerMapProps> = ({
    stickers = [],
    user,
    onLocationSelect,
    selectedLocation,
    filterCountry,
    filterCity,
    filterUserId,
    filterUser,
    height = '600px',
    zoom = 2,
    center = [51.5074, 0.1278]
}) => {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height, width: '100%' }}
            className="z-0"
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <MapClickHandler onLocationSelect={onLocationSelect} />

            {/* Display existing stickers */}
            {stickers
                .filter(sticker => sticker.latitude != null && sticker.longitude != null)
                .filter(sticker => {
                    // country filter
                    if (filterCountry && !(sticker.country || '').toLowerCase().includes(filterCountry.toLowerCase())) return false;
                    // city filter
                    if (filterCity && !(sticker.city || '').toLowerCase().includes(filterCity.toLowerCase())) return false;
                    // user filter (match created_by or user_created name/email)
                    // if a specific user id is selected, filter by that id
                    if (filterUserId) {
                        const userObj = (sticker.created_by && typeof sticker.created_by !== 'string') ? sticker.created_by :
                            (sticker.user_created && typeof sticker.user_created !== 'string') ? sticker.user_created : null;
                        const ownerId = userObj ? (userObj.id || (userObj as any).email || '') : (typeof sticker.user_created === 'string' ? sticker.user_created : (typeof sticker.created_by === 'string' ? sticker.created_by : ''));
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
                })
                .map((sticker) => {
                    const userObj = (sticker.created_by && typeof sticker.created_by !== 'string') ? sticker.created_by :
                        (sticker.user_created && typeof sticker.user_created !== 'string') ? sticker.user_created : null;
                    const ownerId = userObj ? (userObj.id || (userObj as any).email || '') : (typeof sticker.user_created === 'string' ? sticker.user_created : (typeof sticker.created_by === 'string' ? sticker.created_by : ''));
                    const isMine = user && ownerId && user.id === ownerId;
                    return (
                        <Marker
                            key={sticker.id}
                            position={[sticker.latitude!, sticker.longitude!]}
                            icon={isMine ? currentUserIcon : customIcon}
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
                    );
                })
            }

            {/* Display selected location marker */}
            {selectedLocation && (
                <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={customIcon} />
            )}
        </MapContainer>
    );
};

export default StickerMap;
