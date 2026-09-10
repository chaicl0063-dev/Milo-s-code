import type { Metadata } from "next";
import { LoginScreen } from "@/components/LoginScreen";

export const metadata: Metadata = { title: "Sign in · ReAround You" };

export default function LoginPage() {
  return <LoginScreen />;
}
