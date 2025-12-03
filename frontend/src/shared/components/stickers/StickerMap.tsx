'use client';

import React, { useEffect, useState } from 'react';
import { Sticker } from '@/lib/api/salvemundi';
import 'leaflet/dist/leaflet.css';

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

// Counter for unique map IDs (outside component to persist across renders)
let mapIdCounter = 0;

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
    const [mounted, setMounted] = useState(false);
    const [MapComponents, setMapComponents] = useState<any>(null);
    const [leafletIcons, setLeafletIcons] = useState<any>(null);
    const [mapId] = useState(() => `map-${++mapIdCounter}`);
    
    useEffect(() => {
        let isMounted = true;
        
        // Only load Leaflet on the client side
        if (typeof window !== 'undefined') {
            // Dynamically import all Leaflet dependencies
            Promise.all([
                import('react-leaflet'),
                import('leaflet'),
                import('leaflet/dist/images/marker-icon-2x.png'),
                import('leaflet/dist/images/marker-icon.png'),
                import('leaflet/dist/images/marker-shadow.png'),
            ]).then(([reactLeaflet, L, markerIcon2x, markerIcon, markerShadow]) => {
                if (!isMounted) return;
                
                // Fix Leaflet default icon
                // @ts-ignore
                if (L.default.Icon.Default.prototype._getIconUrl) {
                    // @ts-ignore
                    delete L.default.Icon.Default.prototype._getIconUrl;
                    L.default.Icon.Default.mergeOptions({
                        iconUrl: markerIcon.default.src,
                        iconRetinaUrl: markerIcon2x.default.src,
                        shadowUrl: markerShadow.default.src,
                    });
                }

                // Create custom icons
                const customIcon = new L.default.Icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });

                const currentUserIcon = new L.default.Icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });

                setLeafletIcons({ customIcon, currentUserIcon });
                setMapComponents(reactLeaflet);
                setMounted(true);
            });
        }
        
        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, []);

    if (!mounted || !MapComponents || !leafletIcons) {
        return (
            <div style={{ height, width: '100%' }} className="z-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-gray-500">Loading map...</div>
            </div>
        );
    }

    const { MapContainer, TileLayer, Marker, Popup, useMapEvents } = MapComponents;
    const { customIcon, currentUserIcon } = leafletIcons;

    // Component to handle map clicks
    function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
        useMapEvents({
            click: (e: any) => {
                if (onLocationSelect) {
                    onLocationSelect(e.latlng.lat, e.latlng.lng);
                }
            },
        });
        return null;
    }
    return (
        <div style={{ height, width: '100%' }}>
            <MapContainer
                key={mapId}
                center={center}
                zoom={zoom}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
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
        </div>
    );
};

export default StickerMap;
