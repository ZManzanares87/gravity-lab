"use client";

import Link from "next/link";
import { EXPERIMENTS } from "../experiments";
import { useLabStore } from "../store";

export function ExperimentPanel() {
  const sceneId = useLabStore((state) => state.sceneId);
  const selectedOption = useLabStore((state) => state.selectedOption);
  const revealed = useLabStore((state) => state.revealed);
  const selectOption = useLabStore((state) => state.selectOption);
  const check = useLabStore((state) => state.check);

  const experiment = EXPERIMENTS[sceneId];
  const chosen = experiment.options.find((option) => option.id === selectedOption);

  return (
    <section aria-labelledby="experimento-titulo" className="space-y-4">
      <h2 id="experimento-titulo" className="sr-only">
        Pregunta del experimento
      </h2>
      <fieldset disabled={revealed}>
        <legend className="font-bold">{experiment.question}</legend>
        <div className="mt-3 space-y-2">
          {experiment.options.map((option) => (
            <label key={option.id} className="flex items-start gap-2">
              <input
                type="radio"
                name={`prediccion-${sceneId}`}
                value={option.id}
                checked={selectedOption === option.id}
                onChange={() => selectOption(option.id)}
                className="mt-1.5 accent-body-a"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {!revealed && (
        <button
          type="button"
          onClick={check}
          className="bg-body-a px-4 py-2 font-bold text-paper hover:bg-body-a/85"
        >
          Comprobar
        </button>
      )}

      {/* Los lectores de pantalla anuncian la explicación cuando aparece. */}
      <div aria-live="polite">
        {revealed && (
          <div className="space-y-2 border-l-4 border-body-a pl-3">
            {chosen && (
              <p>
                <strong>Tu predicción:</strong> {chosen.label}.
              </p>
            )}
            <p>
              <strong>Lo que ha pasado:</strong> {experiment.explanation}
            </p>
            {sceneId === "tercer-cuerpo" && (
              <Link href="/galeria" className="inline-block underline underline-offset-4">
                Ver la galería de los tres cuerpos
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
