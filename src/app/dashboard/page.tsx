import type { Metadata } from "next";
import DashboardView from "@/components/records/DashboardView";

export const metadata: Metadata = { title: "学习记录" };

export default function DashboardPage() {
  return <DashboardView />;
}
