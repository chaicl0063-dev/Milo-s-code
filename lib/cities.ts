/**
 * 定位失败时的备选城市。坐标故意放在地标附近而不是城市几何中心，
 * 这样 1 公里内一定能搜出足够多的 Wikipedia 地点。
 */
export interface City {
  id: string;
  lat: number;
  lon: number;
  name: { en: string; zh: string };
  country: { en: string; zh: string };
}

export const CITIES: City[] = [
  { id: "paris", lat: 48.8584, lon: 2.2945, name: { en: "Paris", zh: "巴黎" }, country: { en: "France", zh: "法国" } },
  { id: "tokyo", lat: 35.6586, lon: 139.7454, name: { en: "Tokyo", zh: "东京" }, country: { en: "Japan", zh: "日本" } },
  { id: "rome", lat: 41.8902, lon: 12.4922, name: { en: "Rome", zh: "罗马" }, country: { en: "Italy", zh: "意大利" } },
  { id: "new-york", lat: 40.758, lon: -73.9855, name: { en: "New York", zh: "纽约" }, country: { en: "United States", zh: "美国" } },
  { id: "london", lat: 51.5007, lon: -0.1246, name: { en: "London", zh: "伦敦" }, country: { en: "United Kingdom", zh: "英国" } },
  { id: "beijing", lat: 39.9163, lon: 116.3972, name: { en: "Beijing", zh: "北京" }, country: { en: "China", zh: "中国" } },
  { id: "istanbul", lat: 41.0086, lon: 28.9802, name: { en: "Istanbul", zh: "伊斯坦布尔" }, country: { en: "Türkiye", zh: "土耳其" } },
];
