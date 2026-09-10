import type { Metadata } from "next";
import { AboutScreen } from "@/components/AboutScreen";

export const metadata: Metadata = { title: "About · ReAround You" };

export default function AboutPage() {
  return <AboutScreen />;
}
