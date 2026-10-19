"use client";

import { useState } from "react";
import { formatNumber } from "../format";
import { getScene, type ParamSpec, type Params } from "../scenes";
import { useLabStore } from "../store";

/** Resolución del deslizador. Su posición (0–1000) se traduce al valor real. */
const STEPS = 1000;

function toSlider(spec: ParamSpec<Params>, value: number): number {
  const t =
    spec.scale === "log"
      ? (Math.log(value) - Math.log(spec.min)) / (Math.log(spec.max) - Math.log(spec.min))
      : (value - spec.min) / (spec.max - spec.min);
  return Math.round(t * STEPS);
}

function fromSlider(spec: ParamSpec<Params>, position: number): number {
  if (position <= 0) return spec.min;
  if (position >= STEPS) return spec.max;
  const t = position / STEPS;
  const raw =
    spec.scale === "log"
      ? Math.exp(Math.log(spec.min) + t * (Math.log(spec.max) - Math.log(spec.min)))
      : spec.min + t * (spec.max - spec.min);
  // Tres cifras significativas: valores legibles al arrastrar.
  return Number(raw.toPrecision(3));
}

function valueText(spec: ParamSpec<Params>, value: number): string {
  return `${formatNumber(value, 4)}${spec.unit ? ` ${spec.unit}` : ""}`;
}

export function ParamControls() {
  const sceneId = useLabStore((state) => state.sceneId);
  const params = useLabStore((state) => state.params);
  const dispatch = useLabStore((state) => state.dispatch);
  const scene = getScene(sceneId);

  return (
    <section aria-labelledby="controles-titulo">
      <h2 id="controles-titulo" className="text-lg font-bold">
        Controles
      </h2>
      <div className="mt-3 space-y-6">
        {scene.params.map((spec) => (
          <ParamControl
            key={`${sceneId}-${spec.key}`}
            spec={spec}
            value={params[spec.key] ?? spec.min}
            onChange={(value) => dispatch({ type: "setParam", key: spec.key, value })}
          />
        ))}
      </div>
    </section>
  );
}

interface ParamControlProps {
  readonly spec: ParamSpec<Params>;
  readonly value: number;
  onChange(value: number): void;
}

function ParamControl({ spec, value, onChange }: ParamControlProps) {
  const id = `param-${spec.key}`;
  const text = valueText(spec, value);

  return (
    <div>
      <label htmlFor={id} className="flex justify-between gap-2">
        <span>{spec.label}</span>
        <span className="tabular-nums text-ink-soft">{text}</span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={STEPS}
        value={toSlider(spec, value)}
        // El deslizador va de 0 a 1000; el lector de pantalla debe oír el valor real.
        aria-valuetext={text}
        onChange={(event) => onChange(fromSlider(spec, Number(event.target.value)))}
        className="mt-1 w-full accent-body-a"
      />
      {/* key={value}: si el valor cambia desde fuera, el campo se reinicia con él. */}
      <ExactValue key={value} spec={spec} value={value} onCommit={onChange} />
      {spec.marks && (
        <div className="mt-2 flex flex-wrap gap-2">
          {spec.marks.map((mark) => (
            <button
              key={mark.value}
              type="button"
              onClick={() => onChange(mark.value)}
              className="border border-ink/30 px-2 py-0.5 text-sm hover:bg-ink/5"
            >
              {mark.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ExactValueProps {
  readonly spec: ParamSpec<Params>;
  readonly value: number;
  onCommit(value: number): void;
}

/**
 * Campo para escribir un valor exacto. Se confirma al pulsar Intro o al
 * salir del campo, no con cada tecla: escribir "100" no debe aplicar antes "1".
 */
function ExactValue({ spec, value, onCommit }: ExactValueProps) {
  const [draft, setDraft] = useState(String(value).replace(".", ","));

  const commit = () => {
    const parsed = Number(draft.replace(",", "."));
    if (draft.trim() !== "" && Number.isFinite(parsed)) onCommit(parsed);
    else setDraft(String(value).replace(".", ","));
  };

  return (
    <label className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
      Valor exacto
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
        }}
        className="w-28 border border-ink/40 bg-paper px-2 py-1 tabular-nums text-ink"
      />
      {spec.unit}
    </label>
  );
}
