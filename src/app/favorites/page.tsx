import type { Metadata } from "next";
import FavoritesList from "@/components/records/FavoritesList";

export const metadata: Metadata = { title: "收藏夹" };

export default function FavoritesPage() {
  return <FavoritesList />;
}
