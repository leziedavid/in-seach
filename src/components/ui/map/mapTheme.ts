// ─── Shared tile layer config for all Leaflet maps ───────────────────────────
// Kept in one place so every map in the app renders the same "street" and
// "satellite" skins, in both light and dark mode.

export type MapLayerMode = 'street' | 'satellite';
export type MapColorScheme = 'light' | 'dark';

export interface TileConfig {
  url: string;
  attribution: string;
  maxZoom: number;
  bg: string;
}

const STREET: Record<MapColorScheme, TileConfig> = {
  light: {
    // OpenStreetMap standard — routes, tracés, noms bien visibles
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    bg: '#f2efe9', // beige OSM — évite le flash blanc pendant le chargement des tuiles
  },
  dark: {
    // CARTO Dark Matter — même famille que l'overlay satellite déjà utilisé,
    // rendu élégant et sobre proche des apps de livraison premium.
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    bg: '#0b0e14',
  },
};

const SATELLITE: Record<MapColorScheme, TileConfig> = {
  light: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, GIS User Community',
    maxZoom: 19,
    bg: '#1a1a2e',
  },
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, GIS User Community',
    maxZoom: 19,
    bg: '#05070a',
  },
};

// Labels overlay sur satellite (noms des rues/lieux) — plus foncé en dark mode
export const SATELLITE_LABELS_URL: Record<MapColorScheme, string> = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
};

export function getTileConfig(layer: MapLayerMode, mode: MapColorScheme): TileConfig {
  return layer === 'satellite' ? SATELLITE[mode] : STREET[mode];
}
