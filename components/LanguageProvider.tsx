"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { isLang, type Lang } from "@/lib/i18n";

const STORAGE_KEY = "tourguide.lang";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({ lang: "en", setLang: () => {} });

/** 记住用户选的界面语言（存在浏览器 localStorage），并同步到 <html lang> */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // 服务端渲染时不知道用户选过什么语言，只能先按 en 渲染，
  // 挂载后再读 localStorage 纠正一次。这里的 setState 是刻意的，所以关掉该条 lint。
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLang(saved)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLangState(saved);
      } else if (navigator.language.toLowerCase().startsWith("zh")) {
        setLangState("zh");
      }
    } catch {
      /* 隐私模式下 localStorage 可能不可用，忽略即可 */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* 同上 */
    }
  }, []);

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
