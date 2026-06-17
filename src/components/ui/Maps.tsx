'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Icon } from "@iconify/react";
import 'leaflet/dist/leaflet.css';

// ─── Fix Leaflet default icons (Next.js) ─────────────────────────────────────
const fixLeafletIcon = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type PoiType = 'hospital' | 'clinic' | 'school' | 'college' | 'university' | 'police' | 'pharmacy' | 'fire_station' | 'bank' | 'atm';

export interface NearbyPoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: PoiType | string;
}

interface UserMapProps {
  lat: number;
  lng: number;
  userName?: string;
  nearbyPoints?: NearbyPoint[]; // kept for compatibility, ignored (real data fetched)
}

type LayerMode = 'street' | 'satellite';

// ─── Tile layers ──────────────────────────────────────────────────────────────
const TILE_LAYERS: Record<LayerMode, { url: string; attribution: string; maxZoom: number; bg: string }> = {
  street: {
    // OpenStreetMap standard — routes, tracés, noms bien visibles (style chaud proche Yango)
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    bg: '#f2efe9',   // beige OSM — évite le flash blanc pendant le chargement des tuiles
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, GIS User Community',
    maxZoom: 19,
    bg: '#1a1a2e',   // fond sombre pendant le chargement des tuiles satellite
  },
};

// Labels overlay sur satellite (noms des rues/lieux)
const SATELLITE_LABELS_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png';

// ─── POI config ───────────────────────────────────────────────────────────────
const POI_CONFIG: Record<string, { color: string; iconify: string; label: string }> = {
  hospital:     { color: '#DC2626', iconify: 'solar:hospital-bold',            label: 'Hôpital' },
  clinic:       { color: '#DC2626', iconify: 'solar:hospital-bold',            label: 'Clinique' },
  school:       { color: '#D97706', iconify: 'solar:book-bold',                label: 'École' },
  college:      { color: '#D97706', iconify: 'solar:book-bold',                label: 'Collège' },
  university:   { color: '#D97706', iconify: 'solar:buildings-bold',           label: 'Université' },
  police:       { color: '#1D4ED8', iconify: 'solar:shield-bold',              label: 'Police' },
  pharmacy:     { color: '#16A34A', iconify: 'solar:pills-bold',               label: 'Pharmacie' },
  fire_station: { color: '#EA580C', iconify: 'solar:fire-bold',                label: 'Pompiers' },
  bank:         { color: '#7C3AED', iconify: 'solar:bank-bold',                label: 'Banque' },
  atm:          { color: '#7C3AED', iconify: 'solar:card-bold',                label: 'ATM' },
};

const getSvgForType = (type: string): string => {
  const cfg = POI_CONFIG[type] ?? { color: '#6B7280', iconify: '', label: '' };
  const svgs: Record<string, string> = {
    hospital:     `<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" fill="${cfg.color}"/>`,
    clinic:       `<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" fill="${cfg.color}"/>`,
    school:       `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="${cfg.color}" stroke-width="2" fill="none"/>`,
    college:      `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="${cfg.color}" stroke-width="2" fill="none"/>`,
    university:   `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="${cfg.color}" stroke-width="2" fill="none"/>`,
    police:       `<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" fill="${cfg.color}"/>`,
    pharmacy:     `<path d="M20 6h-2.18c.07-.44.18-.88.18-1.33C18 2.53 15.42 0 12.25 0 10.58 0 9.08.72 8 1.87L7 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5 9h-2v2h-2v-2H9v-2h2v-2h2v2h2v2z" fill="${cfg.color}"/>`,
    fire_station: `<path d="M13.5 .67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" fill="${cfg.color}"/>`,
    bank:         `<path d="M2 10v3h1v7h18v-7h1v-3L12 2 2 10zm7 10H7v-7h2v7zm4 0h-2v-7h2v7zm4 0h-2v-7h2v7z" fill="${cfg.color}"/>`,
    atm:          `<path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="${cfg.color}"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">${svgs[type] ?? `<circle cx="12" cy="12" r="6" fill="${cfg.color}"/>`}</svg>`;
};

// ─── Marker factories ─────────────────────────────────────────────────────────
const createUserMarker = (name?: string, buildingName?: string) => L.divIcon({
  className: '',
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;gap:0">
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
        <div style="width:14px;height:14px;background:#3B82F6;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(59,130,246,.6);position:relative;z-index:2"></div>
        <div style="position:absolute;inset:0;margin:auto;width:14px;height:14px;background:#3B82F6;border-radius:50%;animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite;opacity:.35"></div>
        <div style="position:absolute;inset:-4px;background:#3B82F6;border-radius:50%;opacity:.12;filter:blur(4px)"></div>
      </div>
      <div style="margin-top:-6px;background:#3B82F6;color:white;font-size:10px;font-weight:900;padding:3px 10px;border-radius:999px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.2);white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis">
        ${name || 'Ma position'}
      </div>
      ${buildingName ? `<div style="margin-top:2px;background:rgba(255,255,255,.95);color:#1e293b;font-size:9px;font-weight:700;padding:2px 8px;border-radius:999px;border:1px solid rgba(0,0,0,.1);box-shadow:0 1px 4px rgba(0,0,0,.15);white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis">📍 ${buildingName}</div>` : ''}
    </div>
    <style>@keyframes ping{75%,100%{transform:scale(2.2);opacity:0}}</style>
  `,
  iconSize: [160, 80],
  iconAnchor: [80, 27],
  popupAnchor: [0, -27],
});

const createPoiMarker = (type: string, name: string) => {
  const cfg = POI_CONFIG[type] ?? { color: '#6B7280', label: type };
  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
        <div style="width:34px;height:34px;background:white;border-radius:50%;border:2.5px solid ${cfg.color};box-shadow:0 2px 10px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;transition:transform .2s">
          ${getSvgForType(type)}
        </div>
        <div style="background:rgba(255,255,255,.97);color:#1e293b;font-size:8.5px;font-weight:800;padding:2px 7px;border-radius:999px;box-shadow:0 1px 4px rgba(0,0,0,.15);white-space:nowrap;max-width:130px;overflow:hidden;text-overflow:ellipsis;text-align:center;border:1px solid rgba(0,0,0,.08)">
          ${name}
        </div>
      </div>
    `,
    iconSize: [140, 60],
    iconAnchor: [70, 17],
    popupAnchor: [0, -17],
  });
};

// ─── Map auto-center + bg sync ────────────────────────────────────────────────
function MapAutoCenter({ center, trigger, bg }: { center: [number, number]; trigger: number; bg: string }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.setView(center, map.getZoom(), { animate: true });
  }, [map, center, trigger]);
  useEffect(() => {
    const container = map.getContainer();
    container.style.background = bg;
  }, [map, bg]);
  return null;
}

// ─── Overpass POI fetcher ─────────────────────────────────────────────────────
const AMENITY_FILTER = 'hospital|clinic|school|college|university|police|pharmacy|fire_station|bank|atm';
const RADIUS_METERS = 1500;

async function fetchOverpassPOIs(lat: number, lng: number): Promise<NearbyPoint[]> {
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"~"${AMENITY_FILTER}"](around:${RADIUS_METERS},${lat},${lng});
      way["amenity"~"${AMENITY_FILTER}"](around:${RADIUS_METERS},${lat},${lng});
    );
    out center 40;
  `.trim();

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) return [];
  const json = await res.json();

  return (json.elements as any[])
    .filter((el) => el.tags?.name)
    .map((el) => ({
      id: String(el.id),
      lat: el.lat ?? el.center?.lat,
      lng: el.lon ?? el.center?.lon,
      name: el.tags.name,
      type: el.tags.amenity as PoiType,
    }))
    .filter((p) => p.lat && p.lng);
}

// ─── Nominatim reverse geocode ────────────────────────────────────────────────
async function fetchBuildingName(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'fr' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Prefer shop/building name, then amenity, then road
    return data.name || data.address?.amenity || data.address?.shop || data.address?.building || null;
  } catch {
    return null;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function UserMap({ lat, lng, userName }: UserMapProps) {
  const position: [number, number] = [lat, lng];
  const [mounted, setMounted] = useState(false);
  const [layer, setLayer] = useState<LayerMode>('street');
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [pois, setPois] = useState<NearbyPoint[]>([]);
  const [buildingName, setBuildingName] = useState<string | null>(null);
  const [loadingPois, setLoadingPois] = useState(true);

  useEffect(() => {
    fixLeafletIcon();
    setMounted(true);

    // Fetch real POIs from Overpass
    fetchOverpassPOIs(lat, lng)
      .then(setPois)
      .finally(() => setLoadingPois(false));

    // Fetch building/place name at user position
    fetchBuildingName(lat, lng).then(setBuildingName);
  }, [lat, lng]);

  if (!mounted) {
    return (
      <div className="w-full h-[600px] bg-muted/20 animate-pulse rounded-3xl flex flex-col items-center justify-center gap-4 border border-border">
        <Icon icon="solar:map-bold-duotone" className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground font-medium">Initialisation de la carte…</p>
      </div>
    );
  }

  const tl = TILE_LAYERS[layer];

  return (
    <div className="relative w-full h-[600px] overflow-hidden md:border border-border rounded-3xl">
      <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom
        className="w-full h-full z-0"
        zoomControl={false}
        style={{ background: tl.bg }}
      >
        <MapAutoCenter center={position} trigger={recenterTrigger} bg={tl.bg} />

        {/* Base tile layer */}
        <TileLayer url={tl.url} attribution={tl.attribution} maxZoom={tl.maxZoom} />

        {/* Labels overlay on satellite */}
        {layer === 'satellite' && (
          <TileLayer url={SATELLITE_LABELS_URL} maxZoom={19} opacity={0.85} />
        )}

        {/* User marker */}
        <Marker position={position} icon={createUserMarker(userName, buildingName ?? undefined)}>
          <Popup>
            <div className="font-sans min-w-[160px] p-1 space-y-1">
              <p className="font-black text-sm text-blue-600">{userName || 'Ma position'}</p>
              {buildingName && (
                <p className="text-xs font-semibold text-slate-700">📍 {buildingName}</p>
              )}
              <p className="text-[10px] text-muted-foreground italic">Position actuelle</p>
              <div className="pt-1 border-t flex flex-col gap-0.5">
                <span className="text-[9px] text-muted-foreground font-mono">LAT: {lat.toFixed(5)}</span>
                <span className="text-[9px] text-muted-foreground font-mono">LNG: {lng.toFixed(5)}</span>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Real POI markers */}
        {pois.map((poi) => (
          <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={createPoiMarker(poi.type, poi.name)}>
            <Popup>
              <div className="font-sans p-2 min-w-[150px] space-y-1">
                <p className="font-black text-sm text-slate-800">{poi.name}</p>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                  style={{
                    background: (POI_CONFIG[poi.type]?.color ?? '#6B7280') + '18',
                    color: POI_CONFIG[poi.type]?.color ?? '#6B7280',
                  }}
                >
                  {POI_CONFIG[poi.type]?.label ?? poi.type}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ── Controls overlay ────────────────────────────────────────── */}

      {/* Layer toggle */}
      <div className="absolute top-4 right-4 z-[999] flex flex-col gap-2">
        <button
          onClick={() => setLayer(layer === 'street' ? 'satellite' : 'street')}
          className="flex items-center gap-2 bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-bold px-3 py-2 rounded-xl shadow-xl border border-white/60 hover:bg-white transition-all active:scale-95"
          title={layer === 'street' ? 'Vue satellite' : 'Vue plan'}
        >
          <Icon
            icon={layer === 'street' ? 'solar:satellite-bold-duotone' : 'solar:map-bold-duotone'}
            className="w-4 h-4"
          />
          {layer === 'street' ? 'Satellite' : 'Plan'}
        </button>
      </div>

      {/* Recenter + zoom */}
      <div className="absolute bottom-6 right-4 z-[999] flex flex-col gap-2">
        <button
          onClick={() => setRecenterTrigger((n) => n + 1)}
          className="bg-white/95 backdrop-blur-sm text-slate-800 p-3 rounded-2xl shadow-xl border border-white/60 hover:bg-white transition-all active:scale-95"
          title="Recentrer"
        >
          <Icon icon="solar:gps-bold-duotone" className="w-5 h-5 text-blue-500" />
        </button>
      </div>

      {/* POI loading indicator */}
      {loadingPois && (
        <div className="absolute bottom-6 left-4 z-[999] flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-white/60">
          <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 text-blue-500 animate-spin" />
          <span className="text-xs font-semibold text-slate-600">Chargement POIs…</span>
        </div>
      )}

      {/* POI count badge */}
      {!loadingPois && pois.length > 0 && (
        <div className="absolute bottom-6 left-4 z-[999] flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-white/60">
          <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-semibold text-slate-600">{pois.length} points à {RADIUS_METERS / 1000} km</span>
        </div>
      )}
    </div>
  );
}
