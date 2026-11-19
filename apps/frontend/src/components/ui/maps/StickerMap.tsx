'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as maplibregl from 'maplibre-gl';
import { MapPin, Camera, X } from 'lucide-react';
import {
    ActionIcon,
    Box,
    Button,
    Card,
    Center,
    Divider,
    Group,
    Loader,
    Paper,
    Stack,
    Text,
    Title,
    useComputedColorScheme,
} from '@mantine/core';
import 'maplibre-gl/dist/maplibre-gl.css';
import { formatDate } from '@/shared/lib/utils/date';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';
import { safeConsoleError } from '@/server/utils/logger';
import { normalizeCountryNameToDutch } from '@/features/stickers/utils/country-names';

import { type EnrichedUser } from '@/types/auth';
import { type StickerPublic } from '@salvemundi/validations';
import type { StyleSpecification } from 'maplibre-gl';

if (typeof window !== 'undefined') {
    maplibregl.setWorkerUrl(`/map/worker/maplibre-gl-worker.mjs?v=${maplibregl.getVersion()}`);
}

interface StickerMapProps {
    stickers?: StickerPublic[];
    user?: EnrichedUser | null;
    selectedLocation?: { lat: number; lng: number } | null;
    filterCountry?: string;
    filterCity?: string;
}

interface MapMarkerProps {
    map: maplibregl.Map;
    latitude: number;
    longitude: number;
    onClick?: () => void;
    children: React.ReactNode;
}

function MapMarker({ map, latitude, longitude, onClick, children }: MapMarkerProps) {
    const container = useMemo(() => document.createElement('div'), []);
    const onClickRef = useRef(onClick);

    useEffect(() => {
        onClickRef.current = onClick;
    }, [onClick]);

    useEffect(() => {
        const marker = new maplibregl.Marker({ element: container })
            .setLngLat([longitude, latitude])
            .addTo(map);
        return () => {
            marker.remove();
        };
    }, [map, container, latitude, longitude]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (!onClickRef.current) return;
            e.stopPropagation();
            onClickRef.current();
        };
        container.addEventListener('click', handleClick);
        return () => {
            container.removeEventListener('click', handleClick);
        };
    }, [container]);

    return createPortal(children, container);
}

interface MapPopupProps {
    map: maplibregl.Map;
    latitude: number;
    longitude: number;
    onClose: () => void;
    children: React.ReactNode;
}

function MapPopup({ map, latitude, longitude, onClose, children }: MapPopupProps) {
    const container = useMemo(() => document.createElement('div'), []);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        const popup = new maplibregl.Popup({
            closeButton: false,
            anchor: 'bottom',
            maxWidth: 'none',
        })
            .setLngLat([longitude, latitude])
            .setDOMContent(container)
            .addTo(map);

        const handleClose = () => {
            onCloseRef.current();
        };
        popup.on('close', handleClose);

        return () => {
            popup.off('close', handleClose);
            popup.remove();
        };
    }, [map, container, latitude, longitude]);

    return createPortal(children, container);
}

const DEFAULT_CENTER: [number, number] = [5.2913, 52.1326];
const DEFAULT_ZOOM = 2;

export default function StickerMap({
    stickers = [],
    user,
    selectedLocation,
    filterCountry,
    filterCity,
}: StickerMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
    const [popupInfo, setPopupInfo] = useState<StickerPublic | null>(null);
    const [showImage, setShowImage] = useState<boolean>(false);
    const computedColorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: true });
    const isDark = computedColorScheme === 'dark';

    const filteredStickers = useMemo(() => {
        const countryQuery = filterCountry?.trim().toLowerCase() ?? '';
        const cityQuery = filterCity?.trim().toLowerCase() ?? '';

        return stickers.filter((sticker) => {
            if (!Number.isFinite(sticker.latitude) || !Number.isFinite(sticker.longitude)) {
                return false;
            }
            if (countryQuery) {
                const rawCountry = (sticker.country || '').toLowerCase();
                const dutchCountry = normalizeCountryNameToDutch(sticker.country).toLowerCase();
                if (!rawCountry.includes(countryQuery) && !dutchCountry.includes(countryQuery)) {
                    return false;
                }
            }
            if (cityQuery && !(sticker.city || '').toLowerCase().includes(cityQuery)) {
                return false;
            }
            return true;
        });
    }, [stickers, filterCountry, filterCity]);

    const [mapStyleObj, setMapStyleObj] = useState<StyleSpecification | null>(null);

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

                style.layers = style.layers.map((layer) => {
                    if (layer.type === 'symbol' && layer.layout && 'text-font' in layer.layout) {
                        return {
                            ...layer,
                            layout: { ...layer.layout, 'text-font': ['OpenSansRegular'] },
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

    useEffect(() => {
        if (!mapStyleObj || !mapContainerRef.current) return;

        if (mapRef.current) {
            mapRef.current.setStyle(mapStyleObj);
            return;
        }

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: mapStyleObj,
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            cooperativeGestures: true,
            localIdeographFontFamily: 'sans-serif',
            canvasContextAttributes: { antialias: true },
            transformRequest: (url) => {
                if (url.startsWith('/map/')) {
                    return { url: `${window.location.origin}${url}` };
                }
                return { url };
            },
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: false }), 'top-right');
        map.getCanvas().style.cursor = 'grab';

        mapRef.current = map;
        setMapInstance(map);
    }, [mapStyleObj]);

    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            setMapInstance(null);
        };
    }, []);

    return (
        <Box
            pos="relative"
            w="100%"
            h="100%"
            style={{
                zIndex: 0,
                overflow: 'hidden',
                borderRadius: 'var(--mantine-radius-lg)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--mantine-shadow-md)',
            }}
        >
            <style jsx global>{`
                .maplibregl-popup-close-button {
                    display: none !important;
                }
                .maplibregl-popup-content {
                    background: transparent !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    border: none !important;
                }
                .maplibregl-popup-tip {
                    display: none !important;
                }
            `}</style>

            <Box ref={mapContainerRef} w="100%" h="100%" />

            {!mapStyleObj && (
                <Center pos="absolute" inset={0} bg="var(--mantine-color-default)" style={{ zIndex: 10 }}>
                    <Stack align="center" gap="sm">
                        <Loader color="brand" size="md" />
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.12em' }}>
                            Kaart Laden...
                        </Text>
                    </Stack>
                </Center>
            )}

            {mapInstance && filteredStickers.map((sticker) => {
                const isMine = Boolean(user && sticker.user_created?.id && String(user.id) === String(sticker.user_created.id));
                const hasAvatar = !!sticker.user_created?.avatar;
                return (
                    <MapMarker
                        key={sticker.id}
                        map={mapInstance}
                        latitude={sticker.latitude}
                        longitude={sticker.longitude}
                        onClick={() => {
                            setShowImage(false);
                            setPopupInfo(sticker);
                        }}
                    >
                        <Box pos="relative" w={48} h={48} style={{ cursor: 'pointer' }}>
                            <Box
                                pos="relative"
                                w={48}
                                h={48}
                                bg="var(--mantine-color-default)"
                                style={{
                                    overflow: 'hidden',
                                    borderRadius: '9999px',
                                    border: isMine ? '3px solid var(--mantine-color-accent-filled)' : '3px solid #FFFFFF',
                                    boxShadow: isMine
                                        ? '0 0 0 4px rgba(240, 162, 2, 0.25), 0 8px 18px rgba(0, 0, 0, 0.3)'
                                        : '0 6px 12px rgba(0, 0, 0, 0.25)',
                                }}
                            >
                                {hasAvatar ? (
                                    <MediaAsset
                                        asset={sticker.user_created?.avatar}
                                        alt="User"
                                        width={128}
                                        height={128}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <Box pos="relative" w="100%" h="100%" p={6}>
                                        <FallbackLogo className="object-contain p-1" />
                                    </Box>
                                )}
                            </Box>
                            <Box
                                pos="absolute"
                                bottom={-3}
                                right={-3}
                                w={14}
                                h={14}
                                bg={isMine ? 'var(--mantine-color-accent-filled)' : 'var(--mantine-color-brand-filled)'}
                                style={{
                                    borderRadius: '9999px',
                                    border: '2px solid #FFFFFF',
                                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                                }}
                            />
                        </Box>
                    </MapMarker>
                );
            })}

            {mapInstance && selectedLocation && (
                <MapMarker map={mapInstance} latitude={selectedLocation.lat} longitude={selectedLocation.lng}>
                    <Center
                        w={48}
                        h={48}
                        bg="var(--mantine-color-brand-filled)"
                        c="white"
                        style={{
                            borderRadius: '9999px',
                            border: '3px solid #FFFFFF',
                            boxShadow: 'var(--mantine-shadow-xl)',
                        }}
                    >
                        <MapPin size={24} />
                    </Center>
                </MapMarker>
            )}

            {mapInstance && popupInfo && (
                <MapPopup
                    map={mapInstance}
                    latitude={popupInfo.latitude}
                    longitude={popupInfo.longitude}
                    onClose={() => { setPopupInfo(null); setShowImage(false); }}
                >
                    <Card p="md" radius="lg" shadow="xl" w={{ base: 280, sm: 340 }} pos="relative">
                        <ActionIcon
                            type="button"
                            variant="subtle"
                            size="sm"
                            pos="absolute"
                            top={10}
                            right={10}
                            onClick={() => { setPopupInfo(null); setShowImage(false); }}
                            aria-label="Sluiten"
                        >
                            <X size={16} />
                        </ActionIcon>

                        <Stack gap="md">
                            <Group gap="sm" pr="lg" wrap="nowrap">
                                {popupInfo.user_created?.avatar ? (
                                    <Box
                                        pos="relative"
                                        w={44}
                                        h={44}
                                        style={{
                                            flexShrink: 0,
                                            overflow: 'hidden',
                                            borderRadius: '9999px',
                                            border: '2px solid var(--mantine-color-brand-light)',
                                        }}
                                    >
                                        <MediaAsset
                                            asset={popupInfo.user_created.avatar}
                                            alt="avatar"
                                            width={128}
                                            height={128}
                                            className="size-full object-cover"
                                        />
                                    </Box>
                                ) : (
                                    <Box
                                        pos="relative"
                                        w={44}
                                        h={44}
                                        bg="var(--mantine-color-body)"
                                        style={{
                                            flexShrink: 0,
                                            overflow: 'hidden',
                                            borderRadius: '9999px',
                                            border: '2px solid var(--mantine-color-brand-light)',
                                        }}
                                    >
                                        <FallbackLogo className="object-contain p-1.5" />
                                    </Box>
                                )}
                                <Stack gap={2} miw={0} flex={1}>
                                    <Title order={4} size="sm" lineClamp={1}>
                                        {popupInfo.location_name === 'Imported'
                                            ? (popupInfo.city || popupInfo.address || 'Imported')
                                            : (popupInfo.location_name || 'Sticker Locatie')}
                                    </Title>
                                    <Text size="xs" c="dimmed" truncate>
                                        {[popupInfo.city || popupInfo.address, normalizeCountryNameToDutch(popupInfo.country)].filter(Boolean).join(', ')}
                                    </Text>
                                </Stack>
                            </Group>

                            {popupInfo.description && (
                                <Paper p="xs" radius="md" bg="var(--mantine-color-body)">
                                    <Text size="xs" style={{ overflowWrap: 'break-word' }}>
                                        {popupInfo.description}
                                    </Text>
                                </Paper>
                            )}

                            {popupInfo.image && (
                                showImage ? (
                                    <Box
                                        pos="relative"
                                        h={{ base: 160, sm: 192 }}
                                        w="100%"
                                        style={{
                                            overflow: 'hidden',
                                            borderRadius: 'var(--mantine-radius-md)',
                                            border: '1px solid var(--border)',
                                        }}
                                    >
                                        <MediaAsset
                                            asset={popupInfo.image}
                                            alt="Sticker proof"
                                            fill
                                            className="object-cover"
                                        />
                                    </Box>
                                ) : (
                                    <Button
                                        type="button"
                                        fullWidth
                                        size="xs"
                                        leftSection={<Camera size={14} />}
                                        onClick={() => setShowImage(true)}
                                    >
                                        Bekijk Foto Bewijs
                                    </Button>
                                )
                            )}

                            <Divider />

                            <Stack gap={2}>
                                <Text size="xs" c="dimmed" suppressHydrationWarning>
                                    Toegevoegd op {formatDate(popupInfo.date_created)}
                                </Text>
                                {popupInfo.user_created && (
                                    <Text size="xs" c="dimmed">
                                        Door: {popupInfo.user_created.first_name || 'Anonieme'} {popupInfo.user_created.last_name || 'Plakker'}
                                    </Text>
                                )}
                            </Stack>
                        </Stack>
                    </Card>
                </MapPopup>
            )}
        </Box>
    );
}
