'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import { Sticker, getImageUrl } from '@/shared/lib/api/salvemundi';
import 'maplibre-gl/dist/maplibre-gl.css';

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
    const [popupInfo, setPopupInfo] = useState<Sticker | null>(null);

    // Filter stickers based on criteria
    const filteredStickers = useMemo(() => {
        return stickers
            .filter(sticker => sticker.latitude != null && sticker.longitude != null)
            .filter(sticker => {
                // Country filter
                if (filterCountry && !(sticker.country || '').toLowerCase().includes(filterCountry.toLowerCase())) {
                    return false;
                }
                // City filter
                if (filterCity && !(sticker.city || '').toLowerCase().includes(filterCity.toLowerCase())) {
                    return false;
                }
                // User ID filter
                if (filterUserId) {
                    const userObj = (sticker.created_by && typeof sticker.created_by !== 'string')
                        ? sticker.created_by
                        : (sticker.user_created && typeof sticker.user_created !== 'string')
                            ? sticker.user_created
                            : null;
                    const ownerId = userObj
                        ? (userObj.id || (userObj as any).email || '')
                        : (typeof sticker.user_created === 'string'
                            ? sticker.user_created
                            : (typeof sticker.created_by === 'string' ? sticker.created_by : ''));
                    if (ownerId !== filterUserId) return false;
                }
                // Free-text user search
                if (filterUser) {
                    const userObj = (sticker.created_by && typeof sticker.created_by !== 'string')
                        ? sticker.created_by
                        : (sticker.user_created && typeof sticker.user_created !== 'string')
                            ? sticker.user_created
                            : null;
                    const searchText = userObj
                        ? `${userObj.first_name || ''} ${userObj.last_name || ''} ${userObj.email || ''}`.toLowerCase()
                        : '';
                    if (!searchText.includes(filterUser.toLowerCase())) return false;
                }
                return true;
            });
    }, [stickers, filterCountry, filterCity, filterUserId, filterUser]);

    // Handle map click
    const handleMapClick = useCallback((event: any) => {
        if (onLocationSelect) {
            const { lngLat } = event;
            onLocationSelect(lngLat.lat, lngLat.lng);
        }
    }, [onLocationSelect]);

    return (
        <div style={{ height, width: '100%', position: 'relative' }}>
            <Map
                initialViewState={{
                    latitude: center[0],
                    longitude: center[1],
                    zoom: zoom
                }}
                style={{ width: '100%', height: '100%', borderRadius: '1rem' }}
                mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                onClick={handleMapClick}
                cursor={onLocationSelect ? 'crosshair' : 'grab'}
            >
                <NavigationControl position="top-right" />

                {/* Render sticker markers with profile pictures */}
                {filteredStickers.map((sticker) => {
                    const userObj = (sticker.created_by && typeof sticker.created_by !== 'string')
                        ? sticker.created_by
                        : (sticker.user_created && typeof sticker.user_created !== 'string')
                            ? sticker.user_created
                            : null;
                    const ownerId = userObj
                        ? (userObj.id || (userObj as any).email || '')
                        : (typeof sticker.user_created === 'string'
                            ? sticker.user_created
                            : (typeof sticker.created_by === 'string' ? sticker.created_by : ''));
                    const isMine = user && ownerId && user.id === ownerId;

                    // Get user avatar or fallback
                    const avatarUrl = userObj?.avatar
                        ? getImageUrl(userObj.avatar)
                        : '/img/Logo.png';

                    return (
                        <Marker
                            key={sticker.id}
                            latitude={sticker.latitude!}
                            longitude={sticker.longitude!}
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                setPopupInfo(sticker);
                            }}
                        >
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                            >
                                <img
                                    src={avatarUrl}
                                    alt={userObj ? `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() : 'User'}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: isMine ? '3px solid #3b82f6' : '3px solid #ef4444',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                                        transition: 'transform 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                    onError={(e) => {
                                        // Fallback to logo if image fails to load
                                        e.currentTarget.src = '/img/Logo.png';
                                    }}
                                />
                                {/* Small indicator dot at bottom */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        right: '-4px',
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        backgroundColor: isMine ? '#3b82f6' : '#ef4444',
                                        border: '2px solid white',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                    }}
                                />
                            </div>
                        </Marker>
                    );
                })}

                {/* Selected location marker */}
                {selectedLocation && (
                    <Marker
                        latitude={selectedLocation.lat}
                        longitude={selectedLocation.lng}
                    >
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                border: '3px solid white',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: 'bounce 0.5s ease-in-out infinite alternate',
                                fontSize: '24px'
                            }}
                        >
                            📍
                        </div>
                    </Marker>
                )}

                {/* Popup */}
                {popupInfo && (
                    <Popup
                        latitude={popupInfo.latitude!}
                        longitude={popupInfo.longitude!}
                        onClose={() => setPopupInfo(null)}
                        closeButton={true}
                        closeOnClick={false}
                        anchor="bottom"
                    >
                        <div className="p-2 min-w-[200px]">
                            <h3 className="font-bold text-lg mb-1 text-slate-900">
                                {popupInfo.location_name || 'Sticker Location'}
                            </h3>
                            {popupInfo.city && (
                                <p className="text-sm text-slate-600">📍 {popupInfo.city}</p>
                            )}
                            {popupInfo.country && (
                                <p className="text-sm text-slate-600">🌍 {popupInfo.country}</p>
                            )}
                            {popupInfo.description && (
                                <p className="text-sm mt-2 text-slate-700">{popupInfo.description}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-2">
                                Added: {new Date(popupInfo.date_created).toLocaleDateString()}
                            </p>
                            {popupInfo.user_created && (
                                <p className="text-xs text-slate-500 mt-1">
                                    Added by: {typeof popupInfo.user_created === 'string'
                                        ? popupInfo.user_created
                                        : `${popupInfo.user_created.first_name || ''} ${popupInfo.user_created.last_name || ''}`.trim()
                                        || popupInfo.user_created.email
                                        || 'Unknown'}
                                </p>
                            )}
                        </div>
                    </Popup>
                )}
            </Map>

            <style jsx>{`
                @keyframes bounce {
                    from {
                        transform: translateY(0px);
                    }
                    to {
                        transform: translateY(-10px);
                    }
                }
            `}</style>
        </div>
    );
};

export default StickerMap;
