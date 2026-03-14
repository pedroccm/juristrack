import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JurisTrack",
  description: "Monitoramento de processos jurídicos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
