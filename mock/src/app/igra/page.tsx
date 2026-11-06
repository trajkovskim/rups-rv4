import type { Metadata } from "next";
import Game from "@/components/Game";

export const metadata: Metadata = { title: "Igra" };

export default function IgraPage() {
  return <Game />;
}
