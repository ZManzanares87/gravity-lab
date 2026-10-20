"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { EXPERIMENTS } from "../experiments";
import { EXPERIMENT_TITLES } from "../journey";
import { LAW_PARTS } from "../lawParts";
import { SCENE_ORDER } from "../scenes";
import { useLabStore } from "../store";

const STEPS = ["Predice", "Mira", "Entiende"] as const;

/**
 * La guía del experimento en tres pasos. El paso no se guarda aparte: se deduce
 * de la fase del store, así nunca contradice a la simulación. Cada paso enseña
 * solo lo suyo, y la explicación aparece cuando la persona la pide.
 */
export function ExperimentPanel() {
  const sceneId = useLabStore((state) => state.sceneId);
  const selectedOption = useLabStore((state) => state.selectedOption);
  const phase = useLabStore((state) => state.phase);
  const selectOption = useLabStore((state) => state.selectOption);
  const check = useLabStore((state) => state.check);
  const understand = useLabStore((state) => state.understand);
  const dispatch = useLabStore((state) => state.dispatch);

  const watchRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLParagraphElement>(null);
  const previousPhase = useRef(phase);

  // El botón pulsado desaparece al cambiar de paso: el foco va al paso nuevo para
  // que quien usa teclado o lector de pantalla no vuelva al principio de la página.
  // Solo al avanzar, nunca al montar: no se roba el foco a quien vuelve al laboratorio.
  useEffect(() => {
    if (previousPhase.current === "predict" && phase === "watch") watchRef.current?.focus();
    if (previousPhase.current === "ready" && phase === "understand") resultRef.current?.focus();
    previousPhase.current = phase;
  }, [phase]);

  const step = phase === "predict" ? 0 : phase === "understand" ? 2 : 1;
  const experiment = EXPERIMENTS[sceneId];
  const chosen = experiment.options.find((option) => option.id === selectedOption);
  const part = LAW_PARTS.find((p) => p.id === experiment.discovers);
  const next = SCENE_ORDER[SCENE_ORDER.indexOf(sceneId) + 1];

  const goToNext = () => {
    if (!next) return;
    dispatch({ type: "loadScene", scene: next });
    // El foco va al título del experimento nuevo: quien usa teclado o lector
    // de pantalla empieza por arriba, no se queda al final de la guía.
    document.getElementById("experimento-actual")?.focus();
  };

  return (
    <section
      aria-labelledby="guia-titulo"
      className="flex flex-col gap-4 border border-ink bg-paper p-5"
    >
      <h2 id="guia-titulo" className="sr-only">
        Guía del experimento
      </h2>

      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {STEPS.map((name, i) => (
          <li
            key={name}
            aria-current={i === step ? "step" : undefined}
            className={`inline-flex items-center gap-1.5 ${
              i === step ? "font-bold text-body-a" : "text-ink-soft"
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-flex size-6 items-center justify-center rounded-full ${
                i === step ? "bg-body-a text-paper" : "border border-ink-soft"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            {name}
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="ml-1 text-ink-soft">
                →
              </span>
            )}
          </li>
        ))}
      </ol>

      {phase === "predict" ? (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-lg leading-snug font-bold">{experiment.question}</legend>
            {experiment.options.map((option) => (
              <label
                key={option.id}
                className="flex min-h-11 items-center gap-3 border border-ink/25 px-3 has-checked:border-body-a has-checked:bg-body-a/5"
              >
                <input
                  type="radio"
                  name={`prediccion-${sceneId}`}
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={() => selectOption(option.id)}
                  className="size-4 accent-body-a"
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          <button
            type="button"
            onClick={check}
            disabled={!selectedOption}
            className="min-h-12 bg-body-a px-4 text-lg font-bold text-paper hover:bg-body-a/85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Comprobar mi predicción
          </button>
          <p className="text-sm text-ink-soft">
            {selectedOption
              ? "Al comprobar, la simulación se reproduce sola."
              : "Elige una opción para poder comprobarla."}
          </p>
        </>
      ) : (
        chosen && <p className="text-sm text-ink-soft">Tu predicción: «{chosen.label}»</p>
      )}

      {/* Mira: el botón aparece cuando ya se ha visto el resultado, y se anuncia sin mover el foco. */}
      {(phase === "watch" || phase === "ready") && (
        <div ref={watchRef} tabIndex={-1} aria-live="polite" className="flex flex-col gap-3">
          <p className="text-lg font-bold">Mira qué pasa.</p>
          {phase === "ready" && (
            <>
              <p>¿Ha pasado lo que esperabas?</p>
              <button
                type="button"
                onClick={understand}
                className="min-h-12 bg-body-a px-4 text-lg font-bold text-paper hover:bg-body-a/85"
              >
                Entender por qué
              </button>
            </>
          )}
        </div>
      )}

      {phase === "understand" && (
        <>
          <p ref={resultRef} tabIndex={-1} className="text-lg font-bold">
            {!chosen
              ? "Esto es lo que ha pasado."
              : chosen.id === experiment.answer
                ? "¡Has acertado!"
                : "No era eso, y es de lo más normal."}
          </p>
          <p>{experiment.explanation}</p>
          {part && (
            <div className="flex flex-col gap-1 border border-body-c bg-body-c/10 p-4">
              <p className="text-sm font-bold">Nueva pieza de la ley: {part.symbol}</p>
              <p>{part.text}</p>
            </div>
          )}
          {next ? (
            <button
              type="button"
              onClick={goToNext}
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-body-a px-4 font-bold text-paper hover:bg-body-a/85"
            >
              Siguiente: {EXPERIMENT_TITLES[next]}
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          ) : (
            <Link
              href="/galeria"
              className="inline-flex min-h-12 items-center justify-center bg-body-a px-4 font-bold text-paper hover:bg-body-a/85"
            >
              Ver las órbitas de tres cuerpos
            </Link>
          )}
        </>
      )}
    </section>
  );
}
