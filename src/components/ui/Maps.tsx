'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Icon } from "@iconify/react";

// Import CSS directly to ensure it's loaded even if global import fails
import 'leaflet/dist/leaflet.css';

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

// Component to handle map resizing and centering
function MapAutoFunctions({ center, recenterTrigger }: { center: [number, number], recenterTrigger: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Invalidate size and recenter
    map.invalidateSize();
    map.setView(center, 15, { animate: true });
  }, [map, center, recenterTrigger]);
  
  return null;
}

// Custom markers matching ServicesMap style
const createUserMarkerIcon = (name?: string) => L.divIcon({
  className: 'user-marker',
  html: `
      <div class="flex flex-col items-center group">
          <div class="relative w-10 h-10 flex items-center justify-center">
              <div class="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-xl z-20 relative"></div>
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full animate-ping opacity-40"></div>
              <div class="absolute -top-1 opacity-20 w-8 h-8 bg-primary rounded-full blur-md"></div>
          </div>
          <div class="mt-[-8px] bg-primary text-white text-[9px] md:text-[10px] px-2.5 py-1 rounded-full font-black shadow-lg border-2 border-white whitespace-nowrap z-30 transition-all group-hover:scale-110">
              ${name || 'Moi'}
          </div>
      </div>
  `,
  iconSize: [120, 60],
  iconAnchor: [60, 20],
  popupAnchor: [0, -20],
});

const createPointIcon = (type: string, name: string) => {
  const color = type === 'hospital' ? "#EF4444" : type === 'police' ? "#1E3A8A" : "#F59E0B";
  
  return L.divIcon({
    className: 'custom-point-marker',
    html: `
        <div class="flex flex-col items-center group">
            <div class="relative flex items-center justify-center transition-all duration-300 group-hover:scale-110" style="width: 36px; height: 36px;">
                <div class="absolute inset-0 bg-white rounded-full shadow-lg border-2 z-10" style="border-color: ${color};"></div>
                <div class="z-20 text-[${color}] scale-90">
                    ${getIconSvg(type)}
                </div>
            </div>
            <div class="mt-1 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-md border border-border/50 whitespace-nowrap z-0 transition-all group-hover:translate-y-0.5">
                <span class="text-[8px] md:text-[9px] font-black text-foreground uppercase tracking-tight">${name}</span>
            </div>
        </div>
    `,
    iconSize: [120, 60],
    iconAnchor: [60, 18],
    popupAnchor: [0, -18],
  });
};

const getIconSvg = (type: string) => {
  const color = type === 'hospital' ? "#EF4444" : type === 'police' ? "#1E3A8A" : "#F59E0B";
  switch (type) {
    case 'school':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${color}"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
    case 'police':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${color}"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg>`;
    case 'hospital':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${color}"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${color}"><circle cx="12" cy="12" r="3"/></svg>`;
  }
};

export interface NearbyPoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: 'school' | 'police' | 'hospital';
}

interface UserMapProps {
  lat: number;
  lng: number;
  userName?: string;
  nearbyPoints?: NearbyPoint[];
}

export default function UserMap({ lat, lng, userName, nearbyPoints = [] }: UserMapProps) {
  const position: [number, number] = [lat, lng];
  const [mounted, setMounted] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  useEffect(() => {
    fixLeafletIcon();
    setMounted(true);
  }, []);

  const getIconByTypeAndName = (type: string, name: string) => {
    return createPointIcon(type, name);
  };

  if (!mounted) {
    return (
      <div className="w-full h-[600px] bg-muted/20 animate-pulse rounded-3xl flex flex-col items-center justify-center gap-4 border border-border">
        <Icon icon="solar:map-bold-duotone" className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground font-medium">Initialisation de la carte...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] overflow-hidden md:border border-border group rounded-3xl">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={true}
      >
        <MapAutoFunctions center={position} recenterTrigger={recenterTrigger} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* User Marker */}
        <Marker position={position} icon={createUserMarkerIcon(userName)}>
          <Popup className="premium-popup">
            <div className="font-sans min-w-[150px] p-1">
              <p className="font-black text-sm text-primary leading-tight mb-1">{userName || 'Ma Position'}</p>
              <p className="text-[10px] text-muted-foreground mb-2 italic">Position actuelle</p>
              <div className="pt-2 border-t flex flex-col gap-1">
                <span className="text-[9px] text-muted-foreground font-mono opacity-60">LAT: {lat.toFixed(4)}</span>
                <span className="text-[9px] text-muted-foreground font-mono opacity-60">LNG: {lng.toFixed(4)}</span>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Nearby Points Markers */}
        {nearbyPoints.map((point) => (
          <Marker 
            key={point.id} 
            position={[point.lat, point.lng]} 
            icon={getIconByTypeAndName(point.type, point.name)}
          >
            <Popup className="premium-popup">
              <div className="font-sans p-2 text-center min-w-[140px]">
                <p className="font-black text-sm text-foreground mb-2">{point.name}</p>
                <div 
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ 
                    backgroundColor: point.type === 'hospital' ? 'rgba(239, 68, 68, 0.1)' : point.type === 'police' ? 'rgba(30, 58, 138, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: point.type === 'hospital' ? '#EF4444' : point.type === 'police' ? '#1E3A8A' : '#F59E0B'
                  }}
                >
                  {point.type === 'school' ? '🏫 École' : point.type === 'police' ? '🚓 Police' : '🏥 Hôpital'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Recenter Button */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-3">
        <button
          onClick={() => setRecenterTrigger(prev => prev + 1)}
          className="bg-card hover:bg-muted text-foreground p-3 rounded-2xl shadow-xl border border-border transition-all active:scale-95 group/btn"
          title="Recentrer sur moi"
        >
          <Icon icon="solar:gps-bold-duotone" className="w-6 h-6 text-primary group-hover/btn:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}
