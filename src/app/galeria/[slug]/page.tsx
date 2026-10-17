import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrbitPlayer } from "@/gallery/components/OrbitPlayer";
import { findSolution, SOLUTIONS } from "@/gallery/solutions";
import { sampleTrajectory } from "@/gallery/trajectory";

/** Las seis URLs se generan al compilar, como páginas estáticas. */
export function generateStaticParams() {
  return SOLUTIONS.map((solution) => ({ slug: solution.slug }));
}

/** Cualquier otra URL bajo /galeria/ da 404 directamente. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/galeria/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const solution = findSolution(slug);
  return solution ? { title: solution.name, description: solution.summary } : {};
}

function formatNumber(value: number): string {
  return value.toLocaleString("es-ES", { maximumFractionDigits: 6 });
}

export default async function SolutionPage({ params }: PageProps<"/galeria/[slug]">) {
  const { slug } = await params;
  const solution = findSolution(slug);
  if (!solution) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <Link href="/galeria" className="underline underline-offset-4 hover:text-body-a">
        Volver a la galería
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{solution.name}</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <OrbitPlayer solution={solution} trajectory={sampleTrajectory(solution)} />

        <aside className="space-y-6">
          <p className="text-lg">{solution.summary}</p>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-ink-soft">Periodo</dt>
            <dd className="tabular-nums">{formatNumber(solution.period)}</dd>
            <dt className="text-ink-soft">Masas</dt>
            <dd>Tres masas iguales (m = 1)</dd>
            <dt className="text-ink-soft">Gravedad</dt>
            <dd>G = 1 (unidades abstractas)</dd>
          </dl>

          <div className="overflow-x-auto">
            <table className="w-full text-left tabular-nums">
              <caption className="mb-2 text-left font-bold">Condiciones iniciales</caption>
              <thead className="text-ink-soft">
                <tr>
                  <th scope="col" className="pr-3 font-normal">Cuerpo</th>
                  <th scope="col" className="pr-3 font-normal">x</th>
                  <th scope="col" className="pr-3 font-normal">y</th>
                  <th scope="col" className="pr-3 font-normal">vx</th>
                  <th scope="col" className="font-normal">vy</th>
                </tr>
              </thead>
              <tbody>
                {solution.bodies.map((body) => (
                  <tr key={body.id}>
                    <th scope="row" className="pr-3 font-bold">{body.id.toUpperCase()}</th>
                    <td className="pr-3">{formatNumber(body.position.x)}</td>
                    <td className="pr-3">{formatNumber(body.position.y)}</td>
                    <td className="pr-3">{formatNumber(body.velocity.x)}</td>
                    <td>{formatNumber(body.velocity.y)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {solution.notes && (
            <p className="border-l-4 border-ink/30 pl-3 text-ink-soft">{solution.notes}</p>
          )}

          <p className="text-sm text-ink-soft">
            Fuente:{" "}
            {solution.source.url ? (
              <a href={solution.source.url} className="underline underline-offset-2">
                {solution.source.label}
              </a>
            ) : (
              solution.source.label
            )}
          </p>
        </aside>
      </div>
    </main>
  );
}
