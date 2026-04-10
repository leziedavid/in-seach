'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Import CSS directly to ensure it's loaded even if global import fails
import 'leaflet/dist/leaflet.css';

// Component to handle map resizing and centering
function MapResizer({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    // Invalidate size after a short delay to ensure container is fully rendered
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.setView(center, 15, { animate: true });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [map, center]);
  
  return null;
}

// Custom marker icons using SVG for a premium look
const createCustomIcon = (color: string, iconName: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        transition: all 0.3s ease;
      ">
        <div style="transform: rotate(45deg);">
          ${getIconSvg(iconName)}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const getIconSvg = (name: string) => {
  switch (name) {
    case 'user':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    case 'school':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
    case 'police':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    case 'hospital':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v12m-6-6h12M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/></svg>`;
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const userIcon = useMemo(() => createCustomIcon('#3b82f6', 'user'), []);
  const schoolIcon = useMemo(() => createCustomIcon('#f59e0b', 'school'), []);
  const policeIcon = useMemo(() => createCustomIcon('#1e3a8a', 'police'), []);
  const hospitalIcon = useMemo(() => createCustomIcon('#ef4444', 'hospital'), []);

  const getIconByType = (type: string) => {
    switch (type) {
      case 'school': return schoolIcon;
      case 'police': return policeIcon;
      case 'hospital': return hospitalIcon;
      default: return schoolIcon;
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full min-h-[500px]" style={{ height: '500px' }}>
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={true}
      >
        <MapResizer center={position} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Marker */}
        <Marker position={position} icon={userIcon}>
          <Popup className="premium-popup">
            <div className="font-sans min-w-[150px]">
              <p className="font-bold text-lg text-primary leading-tight">{userName || 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground mb-2 italic">Position actuelle</p>
              <div className="pt-2 border-t flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-mono">LAT: {lat}</span>
                <span className="text-[10px] text-muted-foreground font-mono">LNG: {lng}</span>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Nearby Points Markers */}
        {nearbyPoints.map((point) => (
          <Marker 
            key={point.id} 
            position={[point.lat, point.lng]} 
            icon={getIconByType(point.type)}
          >
            <Popup className="premium-popup">
              <div className="font-sans p-1 text-center min-w-[120px]">
                <p className="font-bold text-sm mb-1">{point.name}</p>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase tracking-wider">
                  {point.type === 'school' ? '🏫 École' : point.type === 'police' ? '🚓 Police' : '🏥 Hôpital'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
