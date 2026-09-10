/**
 * 「今日路线」的类型，前后端共用。浏览器端的存取和 hook 在 lib/routeStore.ts（这里不能 import React）。
 */
import type { Place } from "@/lib/places/types";

export const BUDGETS = ["1h", "half", "day"] as const;
export type Budget = (typeof BUDGETS)[number];
export const INTERESTS = ["history", "art", "food", "nature", "kids", "any"] as const;
export type Interest = (typeof INTERESTS)[number];

export function isBudget(v: unknown): v is Budget {
  return typeof v === "string" && (BUDGETS as readonly string[]).includes(v);
}
export function isInterest(v: unknown): v is Interest {
  return typeof v === "string" && (INTERESTS as readonly string[]).includes(v);
}

export interface RouteStop extends Place {
  /** 建议停留分钟数 */
  minutes: number;
  /** 一句「为什么去」 */
  why: string;
  /** 从上一站到这一站：距离、分钟、步行还是建议乘车 */
  legMeters: number;
  legMinutes: number;
  legMode: "walk" | "transit";
}

export interface RoutePlan {
  createdAt: number;
  origin: { lat: number; lon: number };
  budget: Budget;
  interests: Interest[];
  /** 导游的一句开场 */
  intro: string;
  stops: RouteStop[];
  /** 停留 + 路上，总分钟 */
  totalMinutes: number;
  /** 规划走了兜底逻辑（模型没给出可用结果时按距离拼的） */
  fallback?: boolean;
}
