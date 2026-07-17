import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ataque-cli // terminal",
  description: "Console de ataque de forca bruta do laboratorio Ataque x Defesa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
