import type { Metadata } from "next";
import WrongList from "@/components/records/WrongList";

export const metadata: Metadata = { title: "错题本" };

export default function WrongPage() {
  return <WrongList />;
}
