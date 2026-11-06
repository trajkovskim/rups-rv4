import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// latin-ext je nujen zaradi č, š in ž
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: { default: "Meridiani", template: "%s | Meridiani" },
  description: "Učna igra iz geografije in zgodovine na zemljevidu Evrope za 7., 8. in 9. razred.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sl" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
