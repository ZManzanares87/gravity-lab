"use client";

import { EXPERIMENT_TITLES } from "../journey";
import { SCENE_ORDER } from "../scenes";
import { useLabStore } from "../store";
import { LawDialog } from "./LawDialog";

/**
 * "Experimento n de N", la pregunta como título y una barra de progreso.
 * Cada segmento es un botón: se puede saltar a cualquier experimento.
 */
export function ExperimentHeader() {
  const sceneId = useLabStore((state) => state.sceneId);
  const dispatch = useLabStore((state) => state.dispatch);
  const index = SCENE_ORDER.indexOf(sceneId);

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-[1_1_32rem] flex-col gap-2">
        <p className="text-ink-soft">
          Experimento{" "}
          <strong className="text-ink">
            {index + 1} de {SCENE_ORDER.length}
          </strong>
        </p>
        <h1 id="experimento-actual" tabIndex={-1} className="text-2xl leading-tight font-bold sm:text-3xl">
          {EXPERIMENT_TITLES[sceneId]}
        </h1>
        <nav aria-label="Experimentos">
          <ol className="grid max-w-lg auto-cols-fr grid-flow-col gap-1.5">
            {SCENE_ORDER.map((id, i) => {
              const current = id === sceneId;
              return (
                <li key={id}>
                  {/* 44 px de alto para tocar con el dedo; la barra visible es fina. */}
                  <button
                    type="button"
                    aria-label={`Experimento ${i + 1}: ${EXPERIMENT_TITLES[id]}`}
                    aria-current={current ? "step" : undefined}
                    onClick={() => dispatch({ type: "loadScene", scene: id })}
                    className="group flex h-11 w-full items-center"
                  >
                    <span
                      className={`block h-1.5 w-full ${
                        current ? "bg-body-a" : "bg-ink/20 group-hover:bg-ink/40"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
      <LawDialog />
    </div>
  );
}
