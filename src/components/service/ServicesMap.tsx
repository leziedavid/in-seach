"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Service, UserLocation } from "@/types/interface";
import { Icon } from "@iconify/react";
import { calculateDistance } from "@/utils/calculateDistance";
import { motion, AnimatePresence } from "framer-motion";

// Fix for default Leaflet icons in Next.js
const fixLeafletIcon = () => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

// Component to handle map resizing and fitting bounds
function MapAutoFunctions({ userLocation, services, activeServiceId }: {
    userLocation: UserLocation | null,
    services: Service[],
    activeServiceId: string | null
}) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        // Invalidate size in case container size changed
        map.invalidateSize();

        if (activeServiceId) {
            const activeService = services.find(s => s.id === activeServiceId);
            if (activeService && activeService.latitude && activeService.longitude) {
                map.setView([activeService.latitude, activeService.longitude], 16, { animate: true });
                return;
            }
        }

        const validMarkers: [number, number][] = [];

        if (userLocation?.lat && userLocation?.lng) {
            validMarkers.push([userLocation.lat, userLocation.lng]);
        }

        services.forEach(s => {
            if (s.latitude && s.longitude) {
                validMarkers.push([s.latitude, s.longitude]);
            }
        });

        if (validMarkers.length > 0) {
            const bounds = L.latLngBounds(validMarkers);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [map, userLocation, services, activeServiceId]);

    return null;
}

// Custom markers
const createServiceIcon = (isActive: boolean = false, isClosest: boolean = false) => {
    const size = isActive ? 48 : isClosest ? 42 : 36;
    const color = isActive ? "#E11D48" : isClosest ? "#EF4444" : "#F43F5E"; // primary/secondary shades

    return L.divIcon({
        className: 'custom-service-marker',
        html: `
            <div class="flex items-center justify-center" style="width: ${size}px; height: ${size}px;">
                <div class="relative flex items-center justify-center transition-all duration-300" 
                     style="width: ${size}px; height: ${size}px; transform: scale(${isActive ? 1.2 : 1});">
                    <div class="absolute inset-0 bg-white rounded-full shadow-lg border-2" style="border-color: ${color};"></div>
                    <div class="z-10 text-[${color}]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="${size / 1.8}" height="${size / 1.8}" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-3.13-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z"/>
                            <circle cx="12" cy="9" r="2.5"/>
                        </svg>
                    </div>
                    ${isActive ? `<div class="absolute -inset-1 border-2 border-red-500 rounded-full animate-ping opacity-20"></div>` : ''}
                </div>
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
    });
};

const userIcon = L.divIcon({
    className: 'user-marker',
    html: `
        <div class="flex items-center justify-center" style="width: 40px; height: 40px;">
            <div class="relative">
                <div class="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md z-10 relative"></div>
                <div class="absolute top-0 left-0 w-4 h-4 bg-primary rounded-full animate-ping opacity-40"></div>
                <div class="absolute -top-12 -left-8 bg-black/80 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap opacity-0 transition-opacity hover:opacity-100">
                    Moi
                </div>
            </div>
        </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

interface ServicesMapProps {
    services: Service[];
    userLocation: UserLocation | null;
    onSelectService: (service: Service) => void;
}

export default function ServicesMap({ services, userLocation, onSelectService }: ServicesMapProps) {
    const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        fixLeafletIcon();
        setMounted(true);
    }, []);

    // Filter services with valid location and calculate distances
    const servicesWithDistance = useMemo(() => {
        if (!userLocation?.lat || !userLocation?.lng) {
            return services.filter(s => s.latitude && s.longitude).map(s => ({ ...s, distance: null }));
        }

        return services
            .filter(s => s.latitude && s.longitude)
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
        return (
            <div className="w-full h-[600px] bg-muted/20 animate-pulse rounded-3xl flex flex-col items-center justify-center gap-4 border border-border">
                <Icon icon="solar:map-bold-duotone" className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground font-medium">Initialisation de la carte...</p>
            </div>
        );
    }

    const mapCenter: [number, number] = userLocation?.lat && userLocation?.lng ? [userLocation.lat, userLocation.lng] : servicesWithDistance.length > 0 && servicesWithDistance[0].latitude && servicesWithDistance[0].longitude
        ? [servicesWithDistance[0].latitude, servicesWithDistance[0].longitude]
        : [0, 0];

    return (
        <div className="relative w-full h-[600px] overflow-hidden md:border border-border group">
            <MapContainer center={mapCenter} zoom={14} scrollWheelZoom={true} className="w-full h-full z-0">
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

                <MapAutoFunctions userLocation={userLocation} services={servicesWithDistance} activeServiceId={activeServiceId} />

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
                        icon={createServiceIcon(activeServiceId === service.id, service.id === closestServiceId)}
                        eventHandlers={{
                            click: () => {
                                setActiveServiceId(service.id);
                                onSelectService(service);
                            },
                            mouseover: () => setActiveServiceId(service.id),
                            // mouseout: () => setActiveServiceId(null)
                        }}
                    >
                        <Popup className="service-popup">
                            <div className="min-w-[180px] p-2">
                                <h4 className="font-black text-sm text-foreground mb-1 leading-tight">{service.title}</h4>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                                        {service.category?.label || 'Expert'}
                                    </span>
                                    {service.distance !== null && (
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            • {service.distance} km
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-4 border-t pt-2">
                                    <p className="font-black text-secondary text-sm">
                                        {service.price} <span className="text-[9px]">CFA</span>
                                    </p>
                                    <button
                                        onClick={() => onSelectService(service)}
                                        className="bg-primary text-white p-1.5 rounded-full hover:bg-secondary transition-colors"
                                    >
                                        <Icon icon="solar:arrow-right-bold" className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Recenter Button */}
            <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-3">
                <button
                    onClick={() => {
                        setActiveServiceId(null);
                        if (userLocation?.lat && userLocation?.lng) {
                            // The MapAutoFunctions will pick this up via effects
                        }
                    }}
                    className="bg-card hover:bg-muted text-foreground p-3 rounded-2xl shadow-xl border border-border transition-all active:scale-95 group/btn"
                    title="Recentrer sur moi"
                >
                    <Icon icon="solar:gps-bold-duotone" className="w-6 h-6 text-primary group-hover/btn:scale-110 transition-transform" />
                </button>
            </div>
            <div className="absolute top-6 left-6 z-10 hidden md:flex flex-col gap-3 max-h-[calc(100%-3rem)] overflow-y-auto scrollbar-hide">
                <AnimatePresence mode="popLayout">
                    {servicesWithDistance.slice(0, 5).map((service, index) => {
                        const isActive = activeServiceId === service.id;

                        return (
                            <motion.div
                                key={service.id}
                                layout
                                initial={{ x: -100, opacity: 0 }}
                                animate={{
                                    x: 0,
                                    opacity: 1,
                                    width: isActive ? "280px" : "48px",
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                    layout: { type: "spring", stiffness: 300, damping: 30 }
                                }}
                                onClick={() => {
                                    setActiveServiceId(service.id);
                                    onSelectService(service);
                                }}
                                className={`group relative h-12 bg-card/90 backdrop-blur-md rounded-2xl border cursor-pointer transition-all flex items-center overflow-hidden shadow-lg ${isActive ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                            >
                                {/* Icon container (Fixed size) */}
                                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center relative z-10">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-white' : 'bg-primary/5 text-primary group-hover:bg-primary/10'}`}>
                                        <Icon
                                            icon={isActive ? "solar:user-bold-duotone" : "solar:user-broken"}
                                            className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                                        />
                                    </div>
                                </div>

                                {/* Content container (Hidden when not active) */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2, delay: 0.1 }}
                                            className="flex-1 pr-4 flex items-center justify-between min-w-0"
                                        >
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="text-[12px] font-black text-foreground truncate">{service.title}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-0.5">
                                                        <Icon icon="solar:star-bold" className="w-2.5 h-2.5 text-yellow-500" />
                                                        <span className="text-[10px] text-muted-foreground font-bold">4.9</span>
                                                    </div>
                                                    {service.distance !== null && (
                                                        <span className="text-[10px] text-primary font-black uppercase tracking-tighter">{service.distance} km</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <Icon icon="solar:arrow-right-bold" className="w-3 h-3" />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Background glow for active */}
                                {isActive && (
                                    <motion.div
                                        layoutId="glow"
                                        className="absolute inset-0 bg-primary/5 blur-xl -z-10"
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Other experts count badge */}
                {servicesWithDistance.length > 5 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-card/50 backdrop-blur-md px-3 py-1.5 rounded-xl text-center text-[9px] text-muted-foreground font-bold uppercase tracking-widest border border-border/50 w-fit"
                    >
                        + {servicesWithDistance.length - 5} experts
                    </motion.div>
                )}
            </div>
        </div>
    );
}
