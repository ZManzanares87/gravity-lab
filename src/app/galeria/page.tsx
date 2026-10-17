import type { Metadata } from "next";
import Link from "next/link";
import { OrbitThumbnail } from "@/gallery/components/OrbitThumbnail";
import { SOLUTIONS } from "@/gallery/solutions";
import { sampleTrajectory } from "@/gallery/trajectory";

export const metadata: Metadata = {
  title: "Galería de los tres cuerpos",
};

/**
 * Componente de servidor: las seis trayectorias se simulan al compilar
 * el sitio, y el navegador recibe solo HTML y SVG.
 */
export default function GalleryPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">El problema de los tres cuerpos</h1>

      <div className="mt-4 max-w-2xl space-y-3 text-lg text-ink-soft">
        <p>
          Con dos cuerpos, la gravedad tiene una solución exacta: la Luna gira alrededor de la
          Tierra siguiendo siempre la misma órbita. Con tres, no existe una fórmula general, y casi
          cualquier punto de partida acaba en un movimiento caótico.
        </p>
        <p>
          Aun así, hay configuraciones muy concretas en las que los tres cuerpos repiten el mismo
          recorrido una y otra vez. Estas son seis de ellas.
        </p>
      </div>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SOLUTIONS.map((solution) => (
          <li key={solution.slug}>
            <Link
              href={`/galeria/${solution.slug}`}
              id={`orbita-${solution.slug}`}
              className="block h-full border border-ink/20 bg-paper p-4 transition-colors hover:border-ink"
            >
              <div className="aspect-[4/3]">
                <OrbitThumbnail trajectory={sampleTrajectory(solution)} />
              </div>
              <h2 className="mt-4 text-xl font-bold">{solution.name}</h2>
              <p className="mt-1 text-ink-soft">{solution.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
