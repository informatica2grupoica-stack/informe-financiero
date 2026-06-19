import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Informe Ejecutivo Financiero",
  description: "Genera informes ejecutivos profesionales en Excel y Word, y dashboards tipo Power BI, a partir de tu cartola bancaria. Sin base de datos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
