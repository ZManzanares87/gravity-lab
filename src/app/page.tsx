import type { Metadata } from "next";
import Link from "next/link";
import { EXPERIMENT_TITLES } from "@/lab/journey";
import { SCENE_ORDER } from "@/lab/scenes";

export const metadata: Metadata = {
  title: "La gravedad en tres experimentos",
};

const STEPS = [
  {
    name: "Predice",
    text: "Antes de mirar, eliges qué crees que va a pasar. Equivocarse está bien: así se recuerda mejor.",
  },
  {
    name: "Mira",
    text: "La simulación lo muestra con la física real, calculada en el momento.",
  },
  {
    name: "Entiende",
    text: "Te explicamos por qué y descubres una pieza de la ley. Luego puedes experimentar tú.",
  },
] as const;

/** Número pequeño de cada fila. El orden ya lo anuncia la lista (<ol>): el número es solo visual. */
function RowNumber({ value, tone }: { value: number; tone: "step" | "experiment" }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-bold text-paper ${
        tone === "step" ? "bg-body-a" : "bg-ink"
      }`}
    >
      {value}
    </span>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-center gap-8">
        <div className="flex min-w-0 flex-[999_1_32rem] flex-col gap-4">
          <p className="text-sm font-bold tracking-wider text-ink-soft uppercase">
            Un laboratorio para entender la gravedad
          </p>
          <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
            ¿Por qué caen las cosas?
            <br />
            ¿Y por qué la Luna no?
          </h1>
          <p className="max-w-xl text-lg text-ink-soft sm:text-xl">
            Con tres experimentos vas a descubrir, pieza a pieza, la ley que lo explica todo: desde
            una manzana que cae hasta la Luna girando. No hace falta saber física.
          </p>
        </div>

        <svg
          role="img"
          aria-label="La Tierra con la Luna girando a su alrededor"
          viewBox="0 0 320 320"
          className="hidden w-full max-w-56 flex-[1_1_14rem] sm:block"
        >
          <circle cx="160" cy="160" r="128" fill="none" className="stroke-ink" strokeWidth="1.5" strokeDasharray="4 6" />
          <circle cx="160" cy="160" r="46" className="fill-body-c stroke-ink" strokeWidth="2" />
          <circle cx="250" cy="70" r="14" className="fill-paper stroke-body-a" strokeWidth="3" />
          <text x="160" y="226" textAnchor="middle" fontSize="14" className="fill-ink">Tierra</text>
          <text x="272" y="50" textAnchor="middle" fontSize="14" className="fill-ink">Luna</text>
        </svg>
      </div>

      {/* En escritorio, los pasos y los experimentos van en paralelo: la página cabe sin apenas scroll. */}
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <section aria-labelledby="como-funciona" className="flex flex-col gap-3">
          <h2 id="como-funciona" className="text-xl font-bold">
            Cómo funciona cada experimento
          </h2>
          <ol className="flex flex-col gap-2">
            {STEPS.map((step, i) => (
              <li key={step.name} className="flex items-start gap-3 border border-ink/20 bg-paper px-4 py-3">
                <RowNumber value={i + 1} tone="step" />
                <p>
                  <strong>{step.name}.</strong> <span className="text-ink-soft">{step.text}</span>
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="experimentos" className="flex flex-col gap-3">
          <h2 id="experimentos" className="text-xl font-bold">
            Los tres experimentos
          </h2>
          <ol className="flex flex-col gap-2">
            {SCENE_ORDER.map((id, i) => (
              <li key={id} className="flex items-start gap-3 border border-ink/20 bg-paper px-4 py-3">
                <RowNumber value={i + 1} tone="experiment" />
                <strong>{EXPERIMENT_TITLES[id]}</strong>
              </li>
            ))}
          </ol>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link
          href="/laboratorio"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 bg-ink px-5 font-bold text-paper hover:bg-ink/85"
        >
          Empezar el experimento 1
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
        <p className="text-sm text-ink-soft">
          Un tutor con IA te acompaña para resolver dudas y explorar nuevas preguntas con experimentos.
        </p>
          </div>
        </section>
      </div>
    </main>
  );
}
