"use client";

import { getScene } from "../scenes";
import { useLabStore } from "../store";

const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

export function PlaybackControls() {
  const sceneId = useLabStore((state) => state.sceneId);
  const playing = useLabStore((state) => state.playing);
  const finished = useLabStore((state) => state.finished);
  const speed = useLabStore((state) => state.speed);
  const dispatch = useLabStore((state) => state.dispatch);
  const setSpeed = useLabStore((state) => state.setSpeed);

  if (!getScene(sceneId).run) {
    return (
      <p className="text-ink-soft">
        Esta escena es un medidor: mueve la altura y observa cómo cambia la fuerza.
      </p>
    );
  }

  const label = finished ? "Repetir experimento" : playing ? "Pausar" : "Reproducir";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => dispatch({ type: playing ? "pause" : "play" })}
        className="min-w-32 bg-ink px-4 py-2 font-bold text-paper hover:bg-ink/85"
      >
        {label}
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "reset" })}
        className="border border-ink px-4 py-2 font-bold hover:bg-ink/5"
      >
        Reiniciar
      </button>
      <label className="flex items-center gap-2">
        Velocidad
        <select
          value={speed}
          onChange={(event) => setSpeed(Number(event.target.value))}
          className="border border-ink/40 bg-paper px-2 py-2"
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
