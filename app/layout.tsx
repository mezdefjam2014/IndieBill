import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { PlayerProvider } from "@/components/player-provider";
import { GlobalPlayer } from "@/components/global-player";

export const metadata: Metadata = {
  title: { default: "Indie Billboard", template: "%s | Indie Billboard" },
  description: "Independent music ranked by genuine listener activity.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PlayerProvider>
          <Header />
          {children}
          <GlobalPlayer />
        </PlayerProvider>
      </body>
    </html>
  );
}
