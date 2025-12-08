'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
    const [isDark, setIsDark] = useState<boolean>(false);

    const filteredStickers = useMemo(() => {
        return (stickers || [])
            .filter((s) => s.latitude != null && s.longitude != null)
            .filter((sticker) => {
                if (filterCountry && !(sticker.country || '').toLowerCase().includes(filterCountry.toLowerCase())) return false;
                if (filterCity && !(sticker.city || '').toLowerCase().includes(filterCity.toLowerCase())) return false;
                if (filterUserId) {
                    const u = (sticker.created_by && typeof sticker.created_by !== 'string') ? sticker.created_by : (sticker.user_created && typeof sticker.user_created !== 'string') ? sticker.user_created : null;
                    const ownerId = u ? (u.id || (u as any).email || '') : (typeof sticker.user_created === 'string' ? sticker.user_created : (typeof sticker.created_by === 'string' ? sticker.created_by : ''));
                    if (ownerId !== filterUserId) return false;
                }
                if (filterUser) {
                    const u = (sticker.created_by && typeof sticker.created_by !== 'string') ? sticker.created_by : (sticker.user_created && typeof sticker.user_created !== 'string') ? sticker.user_created : null;
                    const searchText = u ? `${u.first_name || ''} ${u.last_name || ''} ${u.email || ''}`.toLowerCase() : '';
                    if (!searchText.includes(filterUser.toLowerCase())) return false;
                }
                return true;
            });
    }, [stickers, filterCountry, filterCity, filterUserId, filterUser]);

    useEffect(() => {
        if (!popupInfo) return;
        const stillVisible = (filteredStickers || []).some((s) => s.id === popupInfo.id);
        if (!stillVisible) setPopupInfo(null);
    }, [filteredStickers, popupInfo]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const check = () => {
            const el = document.documentElement;
            // Prefer explicit site theme stored in localStorage (used by next-themes) or html class
            let explicitTheme: string | null = null;
            try {
                explicitTheme = window.localStorage ? window.localStorage.getItem('theme') : null;
            } catch (e) {
                explicitTheme = null;
            }
            const hasDarkClass = el.classList.contains('dark');
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            // If an explicit theme is set use it, otherwise prefer html.dark, otherwise fallback to system preference
            const result = explicitTheme === 'dark' ? true : explicitTheme === 'light' ? false : hasDarkClass ? true : prefersDark;
            setIsDark(result);
        };
        check();
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const mqHandler = () => check();
        if (mq.addEventListener) mq.addEventListener('change', mqHandler);
        else mq.addListener(mqHandler as any);
        const mo = new MutationObserver(() => check());
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => {
            try {
                if (mq.removeEventListener) mq.removeEventListener('change', mqHandler);
                else mq.removeListener(mqHandler as any);
            } catch (e) {}
            mo.disconnect();
        };
    }, []);

    const handleMapClick = useCallback((event: any) => {
        if (onLocationSelect) {
            const { lngLat } = event;
            onLocationSelect(lngLat.lat, lngLat.lng);
        }
    }, [onLocationSelect]);

    return (
        <div style={{ height, width: '100%', position: 'relative' }}>
            <Map
                key={isDark ? 'dark-map' : 'light-map'}
                initialViewState={{ latitude: center[0], longitude: center[1], zoom }}
                style={{ width: '100%', height: '100%', borderRadius: '1rem' }}
                mapStyle={isDark ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'}
                onClick={handleMapClick}
                cursor={onLocationSelect ? 'crosshair' : 'grab'}
            >
                <NavigationControl position="top-right" />

                {(filteredStickers || []).map((sticker) => {
                    const userObj = (sticker.created_by && typeof sticker.created_by !== 'string') ? sticker.created_by : (sticker.user_created && typeof sticker.user_created !== 'string') ? sticker.user_created : null;
                    const ownerId = userObj ? (userObj.id || (userObj as any).email || '') : (typeof sticker.user_created === 'string' ? sticker.user_created : (typeof sticker.created_by === 'string' ? sticker.created_by : ''));
                    const isMine = user && ownerId && user.id === ownerId;
                    const avatarUrl = userObj?.avatar ? getImageUrl(userObj.avatar) : '/img/Logo.png';

                    return (
                        <Marker key={sticker.id} latitude={sticker.latitude!} longitude={sticker.longitude!} onClick={(e) => { e.originalEvent.stopPropagation(); setPopupInfo(sticker); }}>
                            <div className={`samu-marker ${isMine ? 'samu-marker--mine' : ''}`} role="button" title={userObj ? `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() : 'User'}>
                                <img src={avatarUrl} alt={userObj ? `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() : 'User'} className="samu-marker__img" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/img/Logo.png'; }} />
                                <span className={`samu-marker__dot ${isMine ? 'samu-marker__dot--mine' : ''}`}></span>
                            </div>
                        </Marker>
                    );
                })}

                {selectedLocation && (
                    <Marker latitude={selectedLocation.lat} longitude={selectedLocation.lng}>
                        <div className="samu-marker samu-marker--selected">📍</div>
                    </Marker>
                )}

                {popupInfo && (
                    <Popup latitude={popupInfo.latitude!} longitude={popupInfo.longitude!} onClose={() => setPopupInfo(null)} closeButton anchor="bottom" className="map-popup-theme">
                        <div className="map-popup">
                            <div className="map-popup__head">
                                <img src={popupInfo.user_created && typeof popupInfo.user_created !== 'string' && popupInfo.user_created.avatar ? getImageUrl(popupInfo.user_created.avatar) : '/img/Logo.png'} alt="avatar" className="map-popup__avatar" />
                                <div>
                                    <div className="map-popup__title">{popupInfo.location_name || 'Sticker Location'}</div>
                                    <div className="map-popup__meta">{popupInfo.city ? `📍 ${popupInfo.city}` : ''}{popupInfo.country ? ` • 🌍 ${popupInfo.country}` : ''}</div>
                                </div>
                            </div>
                            {popupInfo.description && <div className="map-popup__desc">{popupInfo.description}</div>}
                            <div className="map-popup__footer">
                                <div className="text-xs text-theme-muted">Added: {new Date(popupInfo.date_created).toLocaleDateString()}</div>
                                {popupInfo.user_created && <div className="text-xs text-theme-muted">Added by: {typeof popupInfo.user_created === 'string' ? popupInfo.user_created : `${popupInfo.user_created.first_name || ''} ${popupInfo.user_created.last_name || ''}`.trim() || popupInfo.user_created.email || 'Unknown'}</div>}
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>

            <style jsx>{`
                @keyframes bounce { from { transform: translateY(0px); } to { transform: translateY(-10px); } }
            `}</style>
        </div>
    );
};

export default StickerMap;

