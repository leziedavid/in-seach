'use client';

import { useTheme } from '@/components/theme-provider';
import type { MapColorScheme } from './mapTheme';

// Thin adapter so map components don't depend directly on the app's theme
// context — just resolves it down to 'light' | 'dark' for tile selection.
export function useMapTheme(): MapColorScheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? 'dark' : 'light';
}
