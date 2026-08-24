'use client';

import { Icon } from '@iconify/react';

// ─── Persistent floating info card ────────────────────────────────────────────
// Always-visible overlay (top-left) for the map's primary marker — avatar,
// title, subtitle with an optional highlighted segment. Same role as the
// courier card on a live-tracking map, adapted to whatever the map is showing
// (a user's last known position, the closest service...).

export function MapInfoCard({
  avatarUrl,
  avatarIcon = 'solar:user-bold-duotone',
  title,
  subtitle,
  highlight,
}: {
  avatarUrl?: string | null;
  avatarIcon?: string;
  title: string;
  subtitle?: string | null;
  highlight?: string | null;
}) {
  return (
    <div className="flex items-center gap-3 bg-card/90 backdrop-blur-md border border-border/60 shadow-lg shadow-black/5 rounded-3xl pl-2.5 pr-4 py-2.5 max-w-[min(85%,320px)]">
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center shrink-0 overflow-hidden relative">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <Icon icon={avatarIcon} className="w-6 h-6 text-primary" />
        )}
      </div>
      <div className="min-w-0">
        <p className="font-black text-sm text-foreground truncate leading-tight">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
            {subtitle}
            {highlight && <span className="text-primary font-bold"> {highlight}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
