import type { Metadata } from "next";
import { MeScreen } from "@/components/MeScreen";

export const metadata: Metadata = { title: "Me · ReAround You" };

export default function MePage() {
  return <MeScreen />;
}
