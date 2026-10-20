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

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12">
      <div className="flex flex-wrap items-center gap-12">
        <div className="flex min-w-0 flex-[999_1_32rem] flex-col gap-5">
          <p className="text-sm font-bold tracking-wider text-ink-soft uppercase">
            Un laboratorio para entender la gravedad
          </p>
          <h1 className="text-4xl leading-tight font-bold sm:text-5xl">
            ¿Por qué caen las cosas?
            <br />
            ¿Y por qué la Luna no?
          </h1>
          <p className="max-w-xl text-lg text-ink-soft sm:text-xl">
            Con tres experimentos vas a descubrir, pieza a pieza, la ley que lo explica todo: desde
            una manzana que cae hasta la Luna girando. No hace falta saber física.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/laboratorio"
              className="inline-flex min-h-13 items-center gap-2 bg-ink px-7 text-lg font-bold text-paper hover:bg-ink/85"
            >
              Empezar el experimento 1
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <span className="text-ink-soft">Unos 10 minutos</span>
          </div>
        </div>

        <svg
          role="img"
          aria-label="La Tierra con la Luna girando a su alrededor"
          viewBox="0 0 320 320"
          className="w-full max-w-72 flex-[1_1_16rem]"
        >
          <circle cx="160" cy="160" r="128" fill="none" className="stroke-ink" strokeWidth="1.5" strokeDasharray="4 6" />
          <circle cx="160" cy="160" r="46" className="fill-body-c stroke-ink" strokeWidth="2" />
          <circle cx="250" cy="70" r="14" className="fill-paper stroke-body-a" strokeWidth="3" />
          <text x="160" y="226" textAnchor="middle" fontSize="14" className="fill-ink">Tierra</text>
          <text x="272" y="50" textAnchor="middle" fontSize="14" className="fill-ink">Luna</text>
        </svg>
      </div>

      <section aria-labelledby="como-funciona" className="flex flex-col gap-4">
        <h2 id="como-funciona" className="text-xl font-bold">
          Cómo funciona cada experimento
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.name} className="flex flex-col gap-2 border border-ink/20 bg-paper p-5">
              <span
                aria-hidden="true"
                className="inline-flex size-8 items-center justify-center rounded-full bg-body-a font-bold text-paper"
              >
                {i + 1}
              </span>
              <strong className="text-lg">{step.name}</strong>
              <span className="text-ink-soft">{step.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="experimentos" className="flex flex-col gap-4">
        <h2 id="experimentos" className="text-xl font-bold">
          Los tres experimentos
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SCENE_ORDER.map((id, i) => (
            <li key={id} className="flex flex-col gap-1 border-t-4 border-ink bg-paper p-4">
              <span className="text-sm text-ink-soft">Experimento {i + 1}</span>
              <strong>{EXPERIMENT_TITLES[id]}</strong>
            </li>
          ))}
        </ol>
        <p className="text-ink-soft">
          En todo momento tienes un tutor con IA: pregúntale lo que no entiendas y puede preparar
          experimentos por ti.
        </p>
      </section>
    </main>
  );
}
