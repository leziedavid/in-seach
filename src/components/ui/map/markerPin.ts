import L from 'leaflet';

// ─── Shared "balloon pin" marker shape ────────────────────────────────────────
// Bold circular badge tapering to a point, white glyph centered in the circle —
// same visual language across every map in the app (courier/POI/service pins).

export function createPinIcon({
  color,
  glyph,
  size = 36,
}: {
  color: string;
  glyph: string; // inner SVG markup, expects white fill
  size?: number;
}) {
  const w = size;
  const h = Math.round(size * 1.3);

  const html = `
    <div style="position:relative;width:${w}px;height:${h}px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.35))">
      <svg width="${w}" height="${h}" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 26 16 26s16-15 16-26C32 7.163 24.837 0 16 0z" fill="${color}" stroke="rgba(255,255,255,.92)" stroke-width="1.5"/>
      </svg>
      <div style="position:absolute;top:0;left:0;width:${w}px;height:${w}px;display:flex;align-items:center;justify-content:center">
        ${glyph}
      </div>
    </div>
  `;

  return L.divIcon({
    className: '',
    html,
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 2],
    popupAnchor: [0, -h + 8],
  });
}
