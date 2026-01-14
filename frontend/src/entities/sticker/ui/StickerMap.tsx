'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import { Sticker, getImageUrl } from '@/shared/lib/api/salvemundi';
import 'maplibre-gl/dist/maplibre-gl.css';

interface StickerMapProps {
    stickers?: Sticker[];
    user?: {
        id?: string | number;
        first_name?: string;
        last_name?: string;
        email?: string;
        avatar?: string;
    } | null;
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
        else mq.addListener(mqHandler as unknown as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
        const mo = new MutationObserver(() => check());
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => {
            try {
                if (mq.removeEventListener) mq.removeEventListener('change', mqHandler);
                else mq.removeListener(mqHandler as unknown as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
            } catch (e) { }
            mo.disconnect();
        };
    }, []);

    const handleMapClick = useCallback((event: { lngLat: { lat: number; lng: number } }) => {
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
                {/* GeolocateControl: lets the user center the map on their current location */}
                <GeolocateControl position="top-right" trackUserLocation={false} />

                {(filteredStickers || []).map((sticker) => {
                    const userObj = (sticker.created_by && typeof sticker.created_by !== 'string') ? (sticker.created_by as { id?: string | number; first_name?: string; last_name?: string; email?: string; avatar?: string }) : (sticker.user_created && typeof sticker.user_created !== 'string') ? (sticker.user_created as { id?: string | number; first_name?: string; last_name?: string; email?: string; avatar?: string }) : null;
                    const ownerId = userObj ? (userObj.id ?? userObj.email ?? '') : (typeof sticker.user_created === 'string' ? sticker.user_created : (typeof sticker.created_by === 'string' ? sticker.created_by : ''));
                    const isMine = Boolean(user && ownerId && String(user.id) === String(ownerId));
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
                    <Popup latitude={popupInfo.latitude!} longitude={popupInfo.longitude!} onClose={() => setPopupInfo(null)} closeButton={false} anchor="bottom" className="map-popup-theme">
                        <div className="map-popup">
                            <button
                                type="button"
                                aria-label="Close"
                                className="map-popup__close"
                                onClick={() => setPopupInfo(null)}
                            >
                                ×
                            </button>
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

                .map-popup-theme .map-popup {
                    position: relative;
                    padding: 12px 14px;
                    max-width: 340px;
                }

                .map-popup-theme .map-popup__avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 8px;
                    object-fit: cover;
                    margin-right: 10px;
                }

                /* Custom close button */
                .map-popup-theme .map-popup__close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 44px;
                    height: 44px;
                    padding: 0;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: 700;
                    line-height: 1;
                    cursor: pointer;
                    box-shadow: 0 8px 18px rgba(0,0,0,0.35);
                    border: 1px solid transparent;
                    transition: transform 0.12s ease, background-color 0.12s ease, opacity 0.12s ease;
                    z-index: 2147483000; /* ensure above map overlays */
                    opacity: 1;
                }

                /* Themed variants */
                ${isDark ? `
                .map-popup-theme .map-popup__close {
                    background: rgba(0,0,0,0.78);
                    color: #ffffff;
                    border-color: rgba(255,255,255,0.12);
                    text-shadow: 0 1px 0 rgba(0,0,0,0.6);
                }
                .map-popup-theme .map-popup__close:hover { background: rgba(0,0,0,0.9); transform: scale(1.06); }
                ` : `
                .map-popup-theme .map-popup__close {
                    background: rgba(255,255,255,0.98);
                    color: #0b0b0b;
                    border-color: rgba(0,0,0,0.06);
                    text-shadow: 0 1px 0 rgba(255,255,255,0.6);
                }
                .map-popup-theme .map-popup__close:hover { background: rgba(255,255,255,1); transform: scale(1.06); }
                `}

                .map-popup-theme .map-popup__close { font-weight: 600; }
            `}</style>
        </div>
    );
};

export default StickerMap;

