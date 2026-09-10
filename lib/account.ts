"use client";

/**
 * 账号（目前只是「登记了邮箱」）：存 localStorage，服务端另存一份到 Upstash Redis（见 /api/signup）。
 * 真正的登录态、跨设备同步以后接 Supabase 之类再做，这里的形状先定下来。
 */
import { useEffect, useState } from "react";

export interface Account {
  email: string;
  provider: "email" | "apple" | "google";
  since: number;
}

const KEY = "tourguide.account";
const EVENT = "tourguide:account";

export function getAccount(): Account | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Account;
    return a && typeof a.email === "string" ? a : null;
  } catch {
    return null;
  }
}

export function setAccount(a: Account | null): void {
  try {
    if (a) window.localStorage.setItem(KEY, JSON.stringify(a));
    else window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* 隐私模式 */
  }
}

export function useAccount(): [Account | null, (a: Account | null) => void] {
  const [account, setState] = useState<Account | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getAccount());
    const onChange = () => setState(getAccount());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return [account, setAccount];
}

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}
