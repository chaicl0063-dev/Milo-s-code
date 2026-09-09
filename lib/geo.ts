/** 把米数格式化成 "350 m" 或 "1.2 km" */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const text = km < 10 ? km.toFixed(1).replace(/\.0$/, "") : String(Math.round(km));
  return `${text} km`;
}

/** 坐标显示成 "48.8582, 2.2945"（四位小数约等于 10 米精度） */
export function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

/** 校验一对坐标是否合法 */
export function isValidCoords(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

/** 把 "48.8584, 2.2945" 这样的字符串解析成坐标，失败返回 null */
export function parseCoords(input: string): { lat: number; lon: number } | null {
  const parts = input.split(/[,\s]+/).filter(Boolean);
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  return isValidCoords(lat, lon) ? { lat, lon } : null;
}
