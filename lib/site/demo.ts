/**
 * 官网演示用的「一个真实地点」脚本（设计提案 I01 / I02）。
 * 地点：巴黎 圣雅克塔（Tour Saint-Jacques）。照片是真实照片（Wikimedia Commons，署名见 photos.ts），
 * 文字是预先核对过的事实写成的导游口吻，不是现场 AI 生成，页面上标明 Scripted demo。
 *
 * 事实依据（均为公开、稳定的记载）：
 * - 塔是圣雅克屠宰场教堂（Saint-Jacques-de-la-Boucherie）仅存的钟楼，火焰哥特式，建于 1509–1523，高约 52 米
 * - 教堂在大革命后被出售并于 1797 年拆除，只留下钟楼
 * - 塔顶四角：圣雅各（手持朝圣杖）与代表四福音书作者中三位的狮、牛、鹰
 * - 塔脚有帕斯卡坐像，纪念他 1648 年在此重复气压实验的记载
 * - 19 世纪初曾被铅弹制造商买下，利用塔高滴铸铅弹
 * - 1998 年作为「法国境内的圣地亚哥-德孔波斯特拉朝圣之路」的组成部分列入世界遗产
 */
import type { PersonaId } from "@/lib/personas";

export const DEMO_PLACE = {
  id: "wp:Tour_Saint-Jacques",
  name: "Tour Saint-Jacques",
  area: "Paris · 4th arrondissement",
  /** 应用里这个地点的详情页（真实数据） */
  appPath: "/p/en/wp%3ATour_Saint-Jacques",
  wikipedia: "https://en.wikipedia.org/wiki/Tour_Saint-Jacques",
} as const;

export interface DemoStep {
  /** 用户这一步点的按钮 */
  prompt: string;
  /** 导游的话，按句子分好（每句单独合成语音） */
  sentences: string[];
}

/** I01：看见 → 讲解 → 追问，一条线，Mia 讲 */
export const DEMO_STORY: { persona: PersonaId; story: DemoStep; followUp: DemoStep } = {
  persona: "mia",
  story: {
    prompt: "Hear its story",
    sentences: [
      "This is all that's left of Saint-Jacques-de-la-Boucherie, a church the butchers' guild finished in 1523.",
      "The church itself was sold and pulled down after the Revolution, so the tower has stood on its own here since 1797.",
      "Pilgrims used to gather at this spot to set off for Santiago de Compostela, which is why it's part of a World Heritage listing today.",
    ],
  },
  followUp: {
    prompt: "What should I look for?",
    sentences: [
      "Look at the very top: the figure on the corner is Saint James with his pilgrim's staff, and the other three corners carry a lion, an ox and an eagle for the evangelists.",
      "At the foot there's a seated Blaise Pascal; the story goes that he repeated his air-pressure experiments up this tower in 1648.",
    ],
  },
};

/** I02：同一地点、同一组事实，两位导游各说一段（约 12 到 18 秒） */
export const DEMO_COMPARE: Record<PersonaId, { sentences: string[]; styleNote: string }> = {
  mia: {
    sentences: [
      "This tower is the last piece of a church the butchers' guild finished in 1523.",
      "Everything around it was pulled down after the Revolution.",
      "Look up at the corner: that's Saint James, staff in hand, still pointing pilgrims towards Santiago.",
    ],
    styleNote: "Calm and unhurried. Starts with what you can see, then one detail to look for.",
  },
  milo: {
    sentences: [
      "See that lonely tower? It used to have a whole church attached, until 1797, when the church was sold off and knocked down.",
      "The tower survived because a manufacturer wanted it for dropping molten lead into shot.",
      "Now it's a World Heritage stop on the road to Santiago.",
    ],
    styleNote: "Gets to the good part fast. Leads with the twist, keeps the facts the same.",
  },
};
