import type { Metadata } from "next";
import { ContactScreen } from "@/components/ContactScreen";

export const metadata: Metadata = { title: "Contact · ReAround You" };

export default function ContactPage() {
  return <ContactScreen />;
}
