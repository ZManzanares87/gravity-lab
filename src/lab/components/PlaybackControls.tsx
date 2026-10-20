"use client";

import { useLabStore } from "../store";

const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

const ICON_PROPS = {
  "aria-hidden": true,
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
} as const;

function PlayIcon() {
  return (
    <svg {...ICON_PROPS} fill="currentColor">
      <path d="M7 4.5v15l13-7.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg {...ICON_PROPS} fill="currentColor">
      <path d="M6 4.5h4v15H6zM14 4.5h4v15h-4z" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg {...ICON_PROPS} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4v5h5" />
    </svg>
  );
}

/**
 * Icono y texto en pantallas medianas; solo icono en móvil. El texto sigue
 * en el HTML (sr-only), así el lector de pantalla siempre dice lo mismo que se ve.
 */
export function PlaybackControls() {
  const playing = useLabStore((state) => state.playing);
  const finished = useLabStore((state) => state.finished);
  const speed = useLabStore((state) => state.speed);
  const dispatch = useLabStore((state) => state.dispatch);
  const setSpeed = useLabStore((state) => state.setSpeed);
  const phase = useLabStore((state) => state.phase);

  // En Predice no hay nada que reproducir: la simulación arranca al comprobar.
  if (phase === "predict") return null;

  const main = finished
    ? { label: "Repetir", icon: <RestartIcon /> }
    : playing
      ? { label: "Pausar", icon: <PauseIcon /> }
      : { label: "Reproducir", icon: <PlayIcon /> };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={() => dispatch({ type: playing ? "pause" : "play" })}
        className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 bg-ink px-3 font-bold text-paper hover:bg-ink/85 sm:min-w-36 sm:px-5"
      >
        {main.icon}
        <span className="sr-only sm:not-sr-only">{main.label}</span>
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "reset" })}
        className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 border border-ink bg-paper px-3 hover:bg-ink/5 sm:px-4"
      >
        <RestartIcon />
        <span className="sr-only sm:not-sr-only">Reiniciar</span>
      </button>
      <label className="inline-flex items-center gap-2 text-ink-soft">
        <span className="sr-only sm:not-sr-only">Velocidad</span>
        <select
          value={speed}
          onChange={(event) => setSpeed(Number(event.target.value))}
          className="min-h-12 border border-ink/40 bg-paper px-2 text-ink"
        >
          {SPEEDS.map((value) => (
            <option key={value} value={value}>
              ×{value.toLocaleString("es-ES")}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
