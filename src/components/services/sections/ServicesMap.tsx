"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Service, UserLocation } from "@/types/interface";
import { Icon } from "@iconify/react";
import { calculateDistance } from "@/utils/calculateDistance";
import { hasValidPrice } from "@/utils/price";
import { motion, AnimatePresence } from "framer-motion";
import { getTileConfig, SATELLITE_LABELS_URL, type MapLayerMode } from "@/components/ui/map/mapTheme";
import { useMapTheme } from "@/components/ui/map/useMapTheme";
import { MapLayerToggle, MapRecenterButton, MapLoadingSkeleton } from "@/components/ui/map/MapChrome";
import { fixLeafletIcon } from "@/components/ui/map/leafletSetup";
import { createPinIcon } from "@/components/ui/map/markerPin";

// Component to handle map resizing, fitting bounds, and bg sync
function MapAutoFunctions({ userLocation, services, activeServiceId, bg }: {
    userLocation: UserLocation | null,
    services: Service[],
    activeServiceId: string | null,
    bg: string,
}) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        map.invalidateSize();

        if (activeServiceId) {
            const activeService = services.find(s => s.id === activeServiceId);
            if (activeService && activeService.latitude && activeService.longitude) {
                map.setView([activeService.latitude, activeService.longitude], 16, { animate: true });
                return;
            }
        }

        const validMarkers: [number, number][] = [];
        if (userLocation?.lat && userLocation?.lng) validMarkers.push([userLocation.lat, userLocation.lng]);
        services.forEach(s => { if (s.latitude && s.longitude) validMarkers.push([s.latitude, s.longitude]); });

        if (validMarkers.length > 0) {
            const bounds = L.latLngBounds(validMarkers);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [map, userLocation, services, activeServiceId]);

    useEffect(() => {
        map.getContainer().style.background = bg;
    }, [map, bg]);

    return null;
}

const USER_PIN_GLYPH = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9V21h19.6v-1.7c0-3.3-6.5-4.9-9.8-4.9z"/></svg>`;
const userIcon = createPinIcon({ color: '#3B82F6', glyph: USER_PIN_GLYPH, size: 38 });

// Service listings often return imageUrls as a single string instead of an
// array (same defensive extraction as the grid view in SearchServies.tsx).
function getServiceImageUrl(service: Service): string | null {
    const raw = service.imageUrls as unknown;
    if (typeof raw === 'string' && raw !== '') return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    if (Array.isArray(service.images) && service.images[0]) return service.images[0];
    return null;
}

const SHOP_FALLBACK_GLYPH = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 9l1-5h14l1 5M4 9v10a1 1 0 001 1h14a1 1 0 001-1V9M4 9h16M9 20v-6h6v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Circular "brand logo" marker + small distance pill underneath — the pin
// shape used everywhere else (markerPin.ts) doesn't fit a photo well, so
// services get their own round avatar marker instead.
const createServiceIcon = (service: Service & { distance: number | null }, isActive: boolean, isClosest: boolean) => {
    const size = isActive ? 52 : isClosest ? 46 : 40;
    const ring = isActive ? "#E11D48" : isClosest ? "#EF4444" : "#F43F5E";
    const imageUrl = getServiceImageUrl(service);
    const total = size + 14;
    const badge = service.distance !== null
        ? `<div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:3px;background:#0f172a;color:white;font-size:9.5px;font-weight:800;padding:2px 7px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.35);white-space:nowrap;border:1.5px solid rgba(255,255,255,.85)">${service.distance} km</div>`
        : '';

    const html = `
      <div style="position:relative;width:${total}px;height:${total}px;">
        <div style="width:${size}px;height:${size}px;margin:${(total - size) / 2}px;border-radius:9999px;background:white;border:3px solid ${ring};box-shadow:0 4px 10px rgba(0,0,0,.28);overflow:hidden;display:flex;align-items:center;justify-content:center;color:${ring}">
          ${imageUrl ? `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover" />` : SHOP_FALLBACK_GLYPH}
        </div>
        ${badge}
      </div>
    `;

    return L.divIcon({
        className: '',
        html,
        iconSize: [total, total],
        iconAnchor: [total / 2, total / 2 + 6],
        popupAnchor: [0, -(total / 2) - 4],
    });
};

interface ServicesMapProps {
    services: Service[];
    userLocation: UserLocation | null;
    onSelectService: (service: Service) => void;
}

export default function ServicesMap({ services, userLocation, onSelectService }: ServicesMapProps) {
    const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [layer, setLayer] = useState<MapLayerMode>('street');
    const colorScheme = useMapTheme();

    useEffect(() => {
        fixLeafletIcon();
        setMounted(true);
    }, []);

    // Filter services with valid location and calculate distances
    const servicesWithDistance = useMemo(() => {
        // First filter valid services
        const validServices = services.filter(s => s.latitude && s.longitude);
        
        // Then ensure uniqueness by ID
        const uniqueServices = Array.from(new Map(validServices.map(s => [s.id, s])).values());

        if (!userLocation?.lat || !userLocation?.lng) {
            return uniqueServices.map(s => ({ ...s, distance: null }));
        }

        return uniqueServices
            .map(s => ({
                ...s,
                distance: calculateDistance(
                    userLocation.lat!,
                    userLocation.lng!,
                    s.latitude!,
                    s.longitude!
                )
            }))
            .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }, [services, userLocation]);

    const closestServiceId = servicesWithDistance.length > 0 ? servicesWithDistance[0].id : null;

    if (!mounted) {
        return <MapLoadingSkeleton label="Initialisation de la carte..." />;
    }

    const mapCenter: [number, number] = userLocation?.lat && userLocation?.lng ? [userLocation.lat, userLocation.lng] : servicesWithDistance.length > 0 && servicesWithDistance[0].latitude && servicesWithDistance[0].longitude
        ? [servicesWithDistance[0].latitude, servicesWithDistance[0].longitude]
        : [0, 0];

    const tl = getTileConfig(layer, colorScheme);
    const activeService = servicesWithDistance.find(s => s.id === activeServiceId) ?? null;

    return (
        <div className="flex w-full h-[600px] rounded-3xl overflow-hidden border border-border">
            {/* ── Results list ─────────────────────────────────────────── */}
            <aside className="hidden md:flex flex-col w-80 shrink-0 bg-card border-r border-border">
                <div className="px-4 py-3 border-b border-border shrink-0">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                        {servicesWithDistance.length} résultat{servicesWithDistance.length > 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-border">
                    {servicesWithDistance.map((service) => {
                        const isActive = activeServiceId === service.id;
                        const imageUrl = getServiceImageUrl(service);
                        return (
                            <button
                                key={service.id}
                                onClick={() => setActiveServiceId(service.id)}
                                className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${isActive ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                            >
                                <div className="w-11 h-11 rounded-full overflow-hidden bg-muted border border-border shrink-0 relative flex items-center justify-center text-muted-foreground">
                                    {imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imageUrl} alt={service.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <Icon icon="solar:shop-bold-duotone" className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-foreground truncate">{service.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {service.distance !== null ? `${service.distance} km` : null}
                                        {service.distance !== null && service.category?.label ? ' • ' : ''}
                                        {service.category?.label}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Icon icon="solar:star-bold" className="w-3.5 h-3.5 text-yellow-500" />
                                    <span className="text-[11px] font-black text-foreground">4.9</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* ── Map ───────────────────────────────────────────────────── */}
            <div className="relative flex-1 min-w-0 group">
                <MapContainer center={mapCenter} zoom={14} scrollWheelZoom zoomControl={false} className="w-full h-full z-0" style={{ background: tl.bg }}>
                    <TileLayer url={tl.url} attribution={tl.attribution} maxZoom={tl.maxZoom} />
                    {layer === 'satellite' && (
                        <TileLayer url={SATELLITE_LABELS_URL[colorScheme]} maxZoom={19} opacity={0.85} />
                    )}

                    <MapAutoFunctions userLocation={userLocation} services={servicesWithDistance} activeServiceId={activeServiceId} bg={tl.bg} />

                    {/* User Location */}
                    {userLocation?.lat && userLocation?.lng && (
                        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                            <Popup>
                                <div className="p-1">
                                    <p className="font-bold text-xs">Ma Position</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Service Markers */}
                    {servicesWithDistance.map((service) => (
                        <Marker
                            key={service.id}
                            position={[service.latitude!, service.longitude!]}
                            icon={createServiceIcon(service, activeServiceId === service.id, service.id === closestServiceId)}
                            eventHandlers={{
                                click: () => setActiveServiceId(service.id),
                                mouseover: () => setActiveServiceId(service.id),
                            }}
                        />
                    ))}
                </MapContainer>

                {/* Layer toggle */}
                <div className="absolute top-4 right-4 z-[999]">
                    <MapLayerToggle layer={layer} onToggle={() => setLayer(l => l === 'street' ? 'satellite' : 'street')} />
                </div>

                {/* Recenter Button */}
                <div className="absolute bottom-6 right-6 z-[999] flex flex-col gap-3">
                    <MapRecenterButton onClick={() => setActiveServiceId(null)} title="Recentrer sur moi" />
                </div>

                {/* ── Selected service detail card (compact — several providers can be
                     selected in a row, a tall card gets cluttered fast) ──────────── */}
                <AnimatePresence>
                    {activeService && (
                        <motion.div
                            key={activeService.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 12 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute left-1/2 -translate-x-1/2 bottom-6 z-[999] w-[calc(100%-2rem)] max-w-xs bg-card/95 backdrop-blur-md border border-border/60 shadow-xl shadow-black/10 rounded-2xl pl-2.5 pr-2 py-2 flex items-center gap-2.5"
                        >
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-muted border border-border shrink-0 relative flex items-center justify-center text-muted-foreground">
                                {getServiceImageUrl(activeService) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={getServiceImageUrl(activeService)!} alt={activeService.title} className="w-full h-full object-cover" />
                                ) : (
                                    <Icon icon="solar:shop-bold-duotone" className="w-4 h-4" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="font-black text-xs text-foreground truncate">{activeService.title}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                    {activeService.distance !== null ? `${activeService.distance} km` : null}
                                    {activeService.distance !== null && activeService.category?.label ? ' • ' : ''}
                                    {activeService.category?.label || 'Expert'}
                                    {hasValidPrice(activeService.price) ? ` • ${activeService.price.toLocaleString()} CFA` : ''}
                                </p>
                            </div>

                            <button
                                onClick={() => onSelectService(activeService)}
                                className="shrink-0 w-8 h-8 rounded-full bg-primary hover:bg-secondary text-white flex items-center justify-center transition-colors"
                                title="Voir plus de détails"
                            >
                                <Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => setActiveServiceId(null)}
                                className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Icon icon="solar:close-circle-bold" className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
