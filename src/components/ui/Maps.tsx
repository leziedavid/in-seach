'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { getTileConfig, SATELLITE_LABELS_URL, type MapLayerMode } from './map/mapTheme';
import { useMapTheme } from './map/useMapTheme';
import { MapLayerToggle, MapRecenterButton, MapFloatingBadge, MapLoadingSkeleton } from './map/MapChrome';
import { fixLeafletIcon } from './map/leafletSetup';
import { createPinIcon } from './map/markerPin';
import { MapInfoCard } from './map/MapInfoCard';

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

// Glyphs are always rendered in white — they sit on top of the pin's own
// saturated background color (see POI_CONFIG), not the other way around.
const getSvgForType = (type: string): string => {
  const svgs: Record<string, string> = {
    hospital:     `<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" fill="white"/>`,
    clinic:       `<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" fill="white"/>`,
    school:       `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" stroke-width="2" fill="none"/>`,
    college:      `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" stroke-width="2" fill="none"/>`,
    university:   `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" stroke-width="2" fill="none"/>`,
    police:       `<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" fill="white"/>`,
    pharmacy:     `<path d="M20 6h-2.18c.07-.44.18-.88.18-1.33C18 2.53 15.42 0 12.25 0 10.58 0 9.08.72 8 1.87L7 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5 9h-2v2h-2v-2H9v-2h2v-2h2v2h2v2z" fill="white"/>`,
    fire_station: `<path d="M13.5 .67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" fill="white"/>`,
    bank:         `<path d="M2 10v3h1v7h18v-7h1v-3L12 2 2 10zm7 10H7v-7h2v7zm4 0h-2v-7h2v7zm4 0h-2v-7h2v7z" fill="white"/>`,
    atm:          `<path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="white"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">${svgs[type] ?? `<circle cx="12" cy="12" r="6" fill="white"/>`}</svg>`;
};

// ─── Marker factories ─────────────────────────────────────────────────────────
// Bold "balloon pin" badges — same shape language as every other map in the
// app (see markerPin.ts). Names/details live in the info card + popups, not
// as always-on labels under each pin, to keep the map clean.
const USER_PIN_GLYPH = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9V21h19.6v-1.7c0-3.3-6.5-4.9-9.8-4.9z"/></svg>`;

const createUserMarker = () => createPinIcon({ color: '#3B82F6', glyph: USER_PIN_GLYPH, size: 40 });

const createPoiMarker = (type: string) => {
  const cfg = POI_CONFIG[type] ?? { color: '#6B7280', label: type };
  return createPinIcon({ color: cfg.color, glyph: getSvgForType(type), size: 34 });
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
  const [layer, setLayer] = useState<MapLayerMode>('street');
  const colorScheme = useMapTheme();
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
    return <MapLoadingSkeleton />;
  }

  const tl = getTileConfig(layer, colorScheme);

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
          <TileLayer url={SATELLITE_LABELS_URL[colorScheme]} maxZoom={19} opacity={0.85} />
        )}

        {/* User marker */}
        <Marker position={position} icon={createUserMarker()}>
          <Popup>
            <div className="font-sans min-w-[160px] p-1 space-y-1">
              <p className="font-black text-sm text-primary">{userName || 'Ma position'}</p>
              {buildingName && (
                <p className="text-xs font-semibold text-foreground">📍 {buildingName}</p>
              )}
              <p className="text-[10px] text-muted-foreground italic">Position actuelle</p>
              <div className="pt-1 border-t border-border flex flex-col gap-0.5">
                <span className="text-[9px] text-muted-foreground font-mono">LAT: {lat.toFixed(5)}</span>
                <span className="text-[9px] text-muted-foreground font-mono">LNG: {lng.toFixed(5)}</span>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Real POI markers */}
        {pois.map((poi) => (
          <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={createPoiMarker(poi.type)}>
            <Popup>
              <div className="font-sans p-2 min-w-[150px] space-y-1">
                <p className="font-black text-sm text-foreground">{poi.name}</p>
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

      {/* Info card */}
      <div className="absolute top-4 left-4 z-[999]">
        <MapInfoCard
          title={userName || 'Ma position'}
          subtitle={buildingName ? `📍 ${buildingName}` : 'Position actuelle'}
        />
      </div>

      {/* Layer toggle */}
      <div className="absolute top-4 right-4 z-[999] flex flex-col gap-2">
        <MapLayerToggle layer={layer} onToggle={() => setLayer(layer === 'street' ? 'satellite' : 'street')} />
      </div>

      {/* Recenter + zoom */}
      <div className="absolute bottom-6 right-4 z-[999] flex flex-col gap-2">
        <MapRecenterButton onClick={() => setRecenterTrigger((n) => n + 1)} />
      </div>

      {/* POI loading indicator */}
      {loadingPois && (
        <div className="absolute bottom-6 left-4 z-[999]">
          <MapFloatingBadge icon="solar:refresh-bold-duotone" spin>Chargement POIs…</MapFloatingBadge>
        </div>
      )}

      {/* POI count badge */}
      {!loadingPois && pois.length > 0 && (
        <div className="absolute bottom-6 left-4 z-[999]">
          <MapFloatingBadge icon="solar:map-point-bold-duotone">
            {pois.length} points à {RADIUS_METERS / 1000} km
          </MapFloatingBadge>
        </div>
      )}
    </div>
  );
}
