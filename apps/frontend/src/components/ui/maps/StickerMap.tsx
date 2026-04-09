'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import { MapPin, Camera, X } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { formatDate } from '@/shared/lib/utils/date';

/**
 * Public Directus URL for client-side asset loading.
 * Note: We use the public URL here because it's a client component.
 */
// All assets are now loaded through our local proxy to keep infrastructure private.
const ASSET_PROXY_URL = '/api/assets';

interface StickerMapProps {
    stickers?: any[];
    user?: any;
    selectedLocation?: { lat: number; lng: number } | null;
    filterCountry?: string;
    filterCity?: string;
    filterUserId?: string;
    filterUser?: string;
    height?: string;
    zoom?: number;
    center?: [number, number];
}

export default function StickerMap({
    stickers = [],
    user,
    selectedLocation,
    filterCountry,
    filterCity,
    filterUserId,
    filterUser,
    height = '600px',
    zoom = 2,
    center = [52.1326, 5.2913] // Netherlands default
}: StickerMapProps) {
    const [popupInfo, setPopupInfo] = useState<any | null>(null);
    const [isDark, setIsDark] = useState<boolean>(false);
    const [showImage, setShowImage] = useState<boolean>(false);

    /**
     * Why: We memoize the filtered list to prevent expensive re-calculations 
     * on every map interaction (pan/zoom).
     */
    const filteredStickers = useMemo(() => {
        return (stickers || [])
            .filter((s) => s.latitude != null && s.longitude != null)
            .filter((sticker) => {
                if (filterCountry && !(sticker.country || '').toLowerCase().includes(filterCountry.toLowerCase())) return false;
                if (filterCity && !(sticker.city || '').toLowerCase().includes(filterCity.toLowerCase())) return false;
                
                if (filterUserId) {
                    const ownerId = sticker.user_created?.id || sticker.user_created;
                    if (String(ownerId) !== String(filterUserId)) return false;
                }
                
                if (filterUser) {
                    const u = sticker.user_created;
                    const searchText = typeof u === 'object' ? `${u.first_name || ''} ${u.last_name || ''} ${u.email || ''}`.toLowerCase() : '';
                    if (!searchText.includes(filterUser.toLowerCase())) return false;
                }
                return true;
            });
    }, [stickers, filterCountry, filterCity, filterUserId, filterUser]);

    /**
     * Why: Sync map style with the site's dark/light mode. 
     * We observe the html class for changes.
     */
    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return (
        <div style={{ height, width: '100%', position: 'relative' }} className="rounded-[var(--radius-2xl)] overflow-hidden shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)]/30">
            <Map
                key={isDark ? 'dark-map' : 'light-map'} // Force re-render on theme change to swap basemaps
                initialViewState={{ latitude: center[0], longitude: center[1], zoom }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={isDark ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'}
                cursor="grab"
            >
                <NavigationControl position="top-right" />
                <GeolocateControl position="top-right" trackUserLocation={false} />

                {filteredStickers.map((sticker) => {
                    const userObj = sticker.user_created;
                    const ownerId = typeof userObj === 'object' ? userObj.id : userObj;
                    const isMine = Boolean(user && ownerId && String(user.id) === String(ownerId));
                    const avatarUrl = (typeof userObj === 'object' && userObj?.avatar) 
                        ? `${ASSET_PROXY_URL}/${userObj.avatar}?width=100&height=100&fit=cover` 
                        : '/img/Logo.png';

                    return (
                        <Marker 
                            key={sticker.id} 
                            latitude={sticker.latitude} 
                            longitude={sticker.longitude} 
                            onClick={(e) => { 
                                e.originalEvent.stopPropagation(); 
                                setPopupInfo(sticker); 
                            }}
                        >
                            <div className={`samu-marker ${isMine ? 'samu-marker--mine' : ''} cursor-pointer`}>
                                <img 
                                    src={avatarUrl} 
                                    className="samu-marker__img" 
                                    alt="User"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/img/Logo.png'; }} 
                                />
                                <span className={`samu-marker__dot ${isMine ? 'samu-marker__dot--mine' : ''}`}></span>
                            </div>
                        </Marker>
                    );
                })}

                {selectedLocation && (
                    <Marker latitude={selectedLocation.lat} longitude={selectedLocation.lng}>
                        <div className="samu-marker samu-marker--selected shadow-2xl scale-110">
                            <MapPin className="h-6 w-6 text-white" />
                        </div>
                    </Marker>
                )}

                {popupInfo && (
                    <Popup 
                        latitude={popupInfo.latitude} 
                        longitude={popupInfo.longitude} 
                        onClose={() => { setPopupInfo(null); setShowImage(false); }} 
                        closeButton={false} 
                        anchor="bottom" 
                        className="map-popup-theme"
                    >
                        <div className="map-popup p-4 relative min-w-[280px]">
                            <button
                                type="button"
                                className="absolute top-2 right-2 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors z-10"
                                onClick={() => { setPopupInfo(null); setShowImage(false); }}
                            >
                                <X className="h-5 w-5 text-[var(--text-muted)]" />
                            </button>

                            <div className="flex gap-4 items-center mb-4 pr-6">
                                <img 
                                    src={typeof popupInfo.user_created === 'object' && popupInfo.user_created.avatar 
                                        ? `${ASSET_PROXY_URL}/${popupInfo.user_created.avatar}?width=80&height=80&fit=cover` 
                                        : '/img/Logo.png'} 
                                    alt="avatar" 
                                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-[var(--theme-purple)]/20" 
                                />
                                <div>
                                    <h3 className="font-black text-[var(--text-main)] leading-tight uppercase tracking-tight">
                                        {popupInfo.location_name === 'Imported' ? (popupInfo.city || popupInfo.address || 'Imported') : (popupInfo.location_name || 'Sticker Locatie')}
                                    </h3>
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                        {[popupInfo.city || popupInfo.address, popupInfo.country].filter(Boolean).join(' • ')}
                                    </p>
                                </div>
                            </div>

                            {popupInfo.description && (
                                <p className="text-sm text-[var(--text-subtle)] leading-relaxed mb-4 bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-[var(--border-color)]/20">
                                    {popupInfo.description}
                                </p>
                            )}

                            {popupInfo.image && (
                                <div className="mt-3">
                                    {showImage ? (
                                        <div className="relative animate-in zoom-in-95 duration-300">
                                            <img 
                                                src={`${ASSET_PROXY_URL}/${popupInfo.image}?width=600&quality=85`} 
                                                alt="Sticker proof" 
                                                className="w-full rounded-xl shadow-lg border border-[var(--border-color)]/30"
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowImage(true)}
                                            className="w-full py-3 bg-gradient-to-r from-[var(--theme-purple)] to-[var(--theme-purple-dark)] text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[10px]"
                                        >
                                            <Camera className="h-4 w-4" />
                                            Bekijk Foto Bewijs
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-[var(--border-color)]/20 flex flex-col gap-1">
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest" suppressHydrationWarning>
                                    Toegevoegd op {formatDate(popupInfo.date_created)}
                                </p>
                                {typeof popupInfo.user_created === 'object' && (
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                        Door: {popupInfo.user_created.first_name} {popupInfo.user_created.last_name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
}
