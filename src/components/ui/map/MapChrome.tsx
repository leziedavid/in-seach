'use client';

import { Icon } from '@iconify/react';
import type { MapLayerMode } from './mapTheme';

// ─── Shared floating controls for every map in the app ───────────────────────
// Themed with design-system tokens (bg-card / text-foreground / border-border)
// so they read correctly in both light and dark mode — unlike the old
// hardcoded `bg-white/95 text-slate-800` used previously.

const CHROME_BASE =
  'bg-card/90 backdrop-blur-md text-foreground shadow-lg shadow-black/5 border border-border/60 transition-all active:scale-95';

export function MapLayerToggle({
  layer,
  onToggle,
}: {
  layer: MapLayerMode;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 ${CHROME_BASE} text-xs font-bold px-3 py-2 rounded-xl hover:bg-card`}
      title={layer === 'street' ? 'Vue satellite' : 'Vue plan'}
    >
      <Icon
        icon={layer === 'street' ? 'solar:satellite-bold-duotone' : 'solar:map-bold-duotone'}
        className="w-4 h-4 text-primary"
      />
      {layer === 'street' ? 'Satellite' : 'Plan'}
    </button>
  );
}

export function MapRecenterButton({ onClick, title = 'Recentrer' }: { onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      className={`${CHROME_BASE} p-3 rounded-2xl hover:bg-card`}
      title={title}
    >
      <Icon icon="solar:gps-bold-duotone" className="w-5 h-5 text-primary" />
    </button>
  );
}

export function MapFloatingBadge({
  icon,
  children,
  spin = false,
}: {
  icon: string;
  children: React.ReactNode;
  spin?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${CHROME_BASE} px-3 py-2 rounded-xl`}>
      <Icon icon={icon} className={`w-4 h-4 text-primary ${spin ? 'animate-spin' : ''}`} />
      <span className="text-xs font-semibold text-foreground/80">{children}</span>
    </div>
  );
}

export function MapLoadingSkeleton({ label = 'Initialisation de la carte…' }: { label?: string }) {
  return (
    <div className="w-full h-[600px] bg-muted/20 animate-pulse rounded-3xl flex flex-col items-center justify-center gap-4 border border-border">
      <Icon icon="solar:map-bold-duotone" className="w-12 h-12 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
    </div>
  );
}
