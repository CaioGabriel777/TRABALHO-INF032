import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Defesa | Painel do laboratorio",
  description: "Painel de monitoramento de logins do laboratorio Ataque x Defesa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
