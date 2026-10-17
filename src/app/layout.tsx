import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import { SiteHeader } from "@/ui/SiteHeader";
import "./globals.css";

/*
 * Atkinson Hyperlegible Next: diseñada por el Braille Institute para
 * personas con baja visión. Cada letra está pensada para no confundirse
 * con otra (l / I, 0 / O). Next.js la descarga al compilar y la sirve
 * desde nuestro propio dominio: sin peticiones a Google desde el navegador.
 *
 * Next.js aún no tiene sus medidas para ajustar la fuente de reserva, así
 * que la desactivamos de forma explícita: mientras carga, el texto se ve
 * con la fuente del sistema y puede moverse levemente al cambiar.
 */
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  // Cada página pone su título y la plantilla añade el nombre de la app.
  title: { default: "Gravity Lab", template: "%s | Gravity Lab" },
  description:
    "Aprende la ley de gravitación universal experimentando, y explora seis soluciones del problema de los tres cuerpos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${atkinson.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:bg-paper focus:px-3 focus:py-2"
        >
          Saltar al contenido
        </a>
        <SiteHeader />
        <div id="contenido" className="flex flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
