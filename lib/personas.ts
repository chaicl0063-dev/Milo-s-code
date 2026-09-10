/**
 * 导游人物。两位：Milo（男声）和 Mia（女声）。
 * 人物决定三件事：朗读用的声音性别、讲解的口吻、界面上显示的名字和头像。
 * 前后端共用，这里不能碰 window。
 */
import type { Lang } from "@/lib/i18n";

export const PERSONAS = ["mia", "milo"] as const;
export type PersonaId = (typeof PERSONAS)[number];
export const DEFAULT_PERSONA: PersonaId = "mia";

export type VoiceGender = "female" | "male";

export interface Persona {
  id: PersonaId;
  name: string;
  gender: VoiceGender;
  /** 引导页和设置页里的一句话介绍 */
  tagline: Record<Lang, string>;
  /** 给模型看的性格说明（英文，模型自己会用讲解语言说） */
  brief: string;
  /** 头像底色 */
  color: string;
}

export const PERSONA: Record<PersonaId, Persona> = {
  mia: {
    id: "mia",
    name: "Mia",
    gender: "female",
    tagline: { en: "Warm and unhurried. Loves the details you would walk past.", zh: "温和从容，爱讲那些你会错过的细节。" },
    brief:
      "Your name is Mia. Personality: warm, calm, observant; you like pointing out small details a visitor would otherwise miss, and you speak in an unhurried, gentle rhythm.",
    color: "#B85C38",
  },
  milo: {
    id: "milo",
    name: "Milo",
    gender: "male",
    tagline: { en: "Lively storyteller. Gets to the good part fast.", zh: "爽朗爱讲故事，很快就切到精彩处。" },
    brief:
      "Your name is Milo. Personality: lively, upbeat, a natural storyteller; you get to the interesting part quickly, use vivid but accurate comparisons, and keep a light sense of humor without becoming silly.",
    color: "#2F5D62",
  },
};

export function isPersona(v: unknown): v is PersonaId {
  return typeof v === "string" && (PERSONAS as readonly string[]).includes(v);
}
