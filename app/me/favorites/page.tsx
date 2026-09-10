import type { Metadata } from "next";
import { FavoritesScreen } from "@/components/FavoritesScreen";

export const metadata: Metadata = { title: "Favorites · ReAround You" };

export default function FavoritesPage() {
  return <FavoritesScreen />;
}
