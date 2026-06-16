export const MOROCCO_CENTER = { lat: 31.7917, lng: -7.0926 };
export const MOROCCO_DEFAULT_ZOOM = 6;

/** Bornes approximatives du territoire marocain (continent + sud). */
export function isInMorocco(lat: number, lng: number): boolean {
  return lat >= 20.5 && lat <= 36.5 && lng >= -17.5 && lng <= -0.5;
}

export function formatCoordinate(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toFixed(6);
}
