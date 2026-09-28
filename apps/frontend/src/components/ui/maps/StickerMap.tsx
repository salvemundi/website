'use client';

import { useState, useMemo, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { MapPin, Camera, X } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { formatDate } from '@/shared/lib/utils/date';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';
import { safeConsoleError } from '@/server/utils/logger';

import { type EnrichedUser } from '@/types/auth';
import { type StickerPublic } from '@salvemundi/validations';
import type { StyleSpecification } from 'maplibre-gl';

interface StickerMapProps {
    stickers?: StickerPublic[];
    user?: EnrichedUser | null;
    selectedLocation?: { lat: number; lng: number } | null;
    filterCountry?: string;
    filterCity?: string;
    filterUserId?: string;
    filterUser?: string;
    height?: string;
    stretchToContainer?: boolean;
    className?: string;
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
    stretchToContainer = false,
    className,
    zoom = 2,
    center = [52.1326, 5.2913]
}: StickerMapProps) {
    const [popupInfo, setPopupInfo] = useState<StickerPublic | null>(null);
    const [isDark, setIsDark] = useState<boolean>(false);
    const [showImage, setShowImage] = useState<boolean>(false);

    const filteredStickers = useMemo(() => {
        return stickers
            .filter((s) => {
                const lat = s.latitude as number | null | undefined;
                const lng = s.longitude as number | null | undefined;
                return lat !== null && lat !== undefined && lng !== null && lng !== undefined;
            })
            .filter((sticker) => {
                if (filterCountry && !(sticker.country || '').toLowerCase().includes(filterCountry.toLowerCase())) return false;
                if (filterCity && !(sticker.city || '').toLowerCase().includes(filterCity.toLowerCase())) return false;
                if (filterUserId && sticker.user_created?.id !== filterUserId) return false;
                if (filterUser) {
                    const u = sticker.user_created;
                    const searchText = u ? `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase() : '';
                    if (!searchText.includes(filterUser.toLowerCase())) return false;
                }
                return true;
            });
    }, [stickers, filterCountry, filterCity, filterUserId, filterUser]);

    const [mapStyleObj, setMapStyleObj] = useState<StyleSpecification | null>(null);

    useEffect(() => {
        const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadAndPatchStyle = async () => {
            const stylePath = isDark ? '/map/styles/dark.json' : '/map/styles/light.json';
            try {
                const origin = window.location.origin;
                const response = await fetch(`${origin}${stylePath}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const style = await response.json() as StyleSpecification;

                if (!isMounted) return;

                if (style.sprite && typeof style.sprite === 'string' && style.sprite.startsWith('/')) {
                    style.sprite = `${origin}${style.sprite}`;
                }
                if (style.glyphs && style.glyphs.startsWith('/')) {
                    style.glyphs = `${origin}/map/glyphs/OpenSansRegular/{range}.pbf?v=1&f={fontstack}`;
                }

                style.layers = style.layers.map(layer => {
                    if (layer.type === 'symbol' && layer.layout && 'text-font' in layer.layout) {
                        return {
                            ...layer,
                            layout: { ...layer.layout, 'text-font': ['OpenSansRegular'] }
                        };
                    }
                    return layer;
                });
                setMapStyleObj(style);
            } catch (err) {
                safeConsoleError('[StickerMap.tsx][StickerMap] ', `Style Load Failed: ${err instanceof Error ? err.message : String(err)}`);
            }
        };
        void loadAndPatchStyle();
        return () => { isMounted = false; };
    }, [isDark]);

    const transformRequest = (url: string) => {
        if (url.startsWith('/map/')) {
            return { url: `${window.location.origin}${url}` };
        }
        return { url };
    };

    return (
        <div
            className={`relative z-0 w-full overflow-hidden rounded-2xl ring-1 ring-(--border-color)/30 ${className ?? 'shadow-(--shadow-card)'}`}
            style={{ height: stretchToContainer ? '100%' : 'min(75vh, var(--map-height, 600px))' }}
        >
            <style jsx>{`
                div { --map-height: ${height}; }
                @media (max-width: 768px) {
                    div { --map-height: calc(100dvh - 4.5rem); }
                }
            `}</style>

            {mapStyleObj ? (
                <Map
                    initialViewState={{ latitude: center[0], longitude: center[1], zoom }}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle={mapStyleObj}
                    cursor="grab"
                    cooperativeGestures={true}
                    transformRequest={transformRequest}
                    mapLib={{
                        ...maplibregl,
                        Map: class extends maplibregl.Map {
                            constructor(options: maplibregl.MapOptions) {
                                const extendedOptions: maplibregl.MapOptions & {
                                    antialias?: boolean;
                                    localIdeographFontFamily?: string
                                } = {
                                    ...options,
                                    antialias: true,
                                    localIdeographFontFamily: 'sans-serif'
                                };
                                super(extendedOptions as maplibregl.MapOptions);
                            }
                        }
                    }}
                >
                    <NavigationControl position="top-right" />
                    <NavigationControl position="top-right" />
                    <GeolocateControl position="top-right" trackUserLocation={false} />

                    {filteredStickers.map((sticker) => {
                        const isMine = Boolean(user && sticker.user_created?.id && String(user.id) === String(sticker.user_created.id));
                        const hasAvatar = !!sticker.user_created?.avatar;
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
                                    {hasAvatar ? (
                                        <MediaAsset
                                            asset={sticker.user_created?.avatar}
                                            alt="User"
                                            width={128}
                                            height={128}
                                            className="samu-marker__img object-cover"
                                        />
                                    ) : (
                                        <div className="samu-marker__img samu-marker__img--logo relative size-full">
                                            <FallbackLogo className="object-contain p-1" />
                                        </div>
                                    )}
                                    <span className={`samu-marker__dot ${isMine ? 'samu-marker__dot--mine' : ''}`}></span>
                                </div>
                            </Marker>
                        );
                    })}

                    {selectedLocation && (
                        <Marker latitude={selectedLocation.lat} longitude={selectedLocation.lng}>
                            <div className="samu-marker samu-marker--selected scale-110 shadow-2xl">
                                <MapPin className="size-6 text-white" />
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
                            <div className="map-popup relative flex w-[290px] flex-col gap-4 rounded-3xl border border-(--border-color)/25 bg-(--bg-card) p-5 text-(--text-main) shadow-2xl sm:w-90">
                                <button
                                    type="button"
                                    className="absolute top-3 right-3 z-10 rounded-full p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                    onClick={() => { setPopupInfo(null); setShowImage(false); }}
                                >
                                    <X className="size-4 text-(--text-muted)" />
                                </button>

                                <div className="flex items-center gap-3 pr-6">
                                    {popupInfo.user_created?.avatar ? (
                                        <MediaAsset
                                            asset={popupInfo.user_created.avatar}
                                            alt="avatar"
                                            width={128}
                                            height={128}
                                            className="size-11 shrink-0 rounded-full object-cover ring-2 ring-(--theme-purple)/20"
                                        />
                                    ) : (
                                        <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-(--bg-card) ring-2 ring-(--theme-purple)/20">
                                            <FallbackLogo className="object-contain p-1.5" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="truncate text-sm leading-tight font-semibold text-(--text-main) sm:text-base">
                                            {popupInfo.location_name === 'Imported' ? (popupInfo.city || popupInfo.address || 'Imported') : (popupInfo.location_name || 'Sticker Locatie')}
                                        </h3>
                                        <p className="mt-0.5 truncate text-xs font-medium text-(--text-muted)">
                                            {[popupInfo.city || popupInfo.address, popupInfo.country].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                </div>

                                {popupInfo.description && (
                                    <p className="rounded-2xl border border-(--border-color)/10 bg-(--bg-main)/50 p-3 text-xs leading-relaxed wrap-break-word text-(--text-subtle) sm:text-sm">
                                        {popupInfo.description}
                                    </p>
                                )}

                                {popupInfo.image && (
                                    <div className="mt-1">
                                        {showImage ? (
                                            <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-(--border-color)/20 shadow-md sm:h-48">
                                                <MediaAsset
                                                    asset={popupInfo.image}
                                                    alt="Sticker proof"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setShowImage(true)}
                                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-(--theme-purple) to-(--theme-purple-dark) py-2.5 text-[9px] font-bold tracking-widest text-white uppercase shadow-lg transition-all hover:shadow-xl sm:text-[10px]"
                                            >
                                                <Camera className="size-3.5" />
                                                Bekijk Foto Bewijs
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-col gap-1 border-t border-(--border-color)/10 pt-3 text-[9px] font-medium text-(--text-muted) sm:text-[10px]">
                                    <p suppressHydrationWarning>
                                        Toegevoegd op {formatDate(popupInfo.date_created)}
                                    </p>
                                    {popupInfo.user_created && (
                                        <p>
                                            Door: {popupInfo.user_created.first_name || 'Anonieme'} {popupInfo.user_created.last_name || 'Plakker'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    )}
                </Map>
            ) : (
                <div className="flex size-full items-center justify-center bg-(--bg-card)">
                    <div className="flex animate-pulse flex-col items-center gap-4">
                        <div className="size-12 animate-spin rounded-full border-4 border-(--theme-purple) border-t-transparent" />
                        <span className="text-xs font-bold tracking-widest text-(--text-muted) uppercase">Kaart Laden...</span>
                    </div>
                </div>
            )}
        </div>
    );
}