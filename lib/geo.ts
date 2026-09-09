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

/** 两点间球面距离，单位米（Haversine 公式） */
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/* ------------------------------------------------------------------ */
/* GCJ-02（高德、腾讯用的「火星坐标」）和 WGS-84（GPS、OSM、Wikipedia）互转 */
/* 经典的近似算法，误差 1 到 2 米，对本项目足够。                          */
/* ------------------------------------------------------------------ */

const A = 6378245.0;
const EE = 0.00669342162296594323;

/** 粗略判断坐标是否在中国境内（高德只在境内做了偏转） */
export function isInChina(lat: number, lon: number): boolean {
  return lon >= 72.004 && lon <= 137.8347 && lat >= 0.8293 && lat <= 55.8271;
}

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLon(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0;
  return ret;
}

function delta(lat: number, lon: number): { dLat: number; dLon: number } {
  let dLat = transformLat(lon - 105.0, lat - 35.0);
  let dLon = transformLon(lon - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * Math.PI);
  dLon = (dLon * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return { dLat, dLon };
}

export function wgs84ToGcj02(lat: number, lon: number): { lat: number; lon: number } {
  if (!isInChina(lat, lon)) return { lat, lon };
  const { dLat, dLon } = delta(lat, lon);
  return { lat: lat + dLat, lon: lon + dLon };
}

export function gcj02ToWgs84(lat: number, lon: number): { lat: number; lon: number } {
  if (!isInChina(lat, lon)) return { lat, lon };
  const { dLat, dLon } = delta(lat, lon);
  return { lat: lat - dLat, lon: lon - dLon };
}
