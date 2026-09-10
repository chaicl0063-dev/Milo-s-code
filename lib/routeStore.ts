"use client";

/** 「今日路线」在浏览器里的存取：localStorage + 一个自定义事件做跨组件同步 */
import { useEffect, useState } from "react";
import type { RoutePlan } from "@/lib/route";

const KEY = "tourguide.route";
const EVENT = "tourguide:route";

export function loadRoute(): RoutePlan | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const plan = JSON.parse(raw) as RoutePlan;
    return Array.isArray(plan.stops) && plan.stops.length > 0 ? plan : null;
  } catch {
    return null;
  }
}

export function saveRoute(plan: RoutePlan | null): void {
  try {
    if (plan) window.localStorage.setItem(KEY, JSON.stringify(plan));
    else window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* 隐私模式 */
  }
}

/** 当前路线；跨组件同步靠一个自定义事件 */
export function useRoute(): [RoutePlan | null, (p: RoutePlan | null) => void] {
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlan(loadRoute());
    const onChange = () => setPlan(loadRoute());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return [plan, saveRoute];
}
