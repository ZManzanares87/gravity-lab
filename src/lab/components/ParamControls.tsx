"use client";

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

/** Los deslizadores de la escena: una columna en móvil, hasta tres en escritorio. */
export function ParamControls() {
  const sceneId = useLabStore((state) => state.sceneId);
  const params = useLabStore((state) => state.params);
  const dispatch = useLabStore((state) => state.dispatch);
  const scene = getScene(sceneId);

  return (
    <div className="grid gap-x-8 gap-y-6 pt-1 sm:grid-cols-2 lg:grid-cols-3">
      {scene.params.map((spec) => (
        <ParamControl
          key={`${sceneId}-${spec.key}`}
          spec={spec}
          value={params[spec.key] ?? spec.min}
          onChange={(value) => dispatch({ type: "setParam", key: spec.key, value })}
        />
      ))}
    </div>
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
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-baseline justify-between gap-3">
        <span>{spec.label}</span>
        <span className="font-bold whitespace-nowrap tabular-nums">{text}</span>
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
        className="h-8 w-full accent-body-a"
      />
      {spec.marks && (
        <div className="flex flex-wrap gap-2">
          {spec.marks.map((mark) => (
            <button
              key={mark.value}
              type="button"
              onClick={() => onChange(mark.value)}
              className="min-h-9 border border-ink/30 px-2 text-sm hover:bg-ink/5"
            >
              {mark.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
