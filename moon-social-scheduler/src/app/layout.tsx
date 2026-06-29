import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Postall · El publisher de redes más accesible",
  description:
    "Programa y publica en todas tus redes desde un solo panel: fácil, asequible y para todos. Calendario, biblioteca, analítica y API + MCP para agentes. Sin contratos anuales y con alertas de fallo y reconexión automática.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
