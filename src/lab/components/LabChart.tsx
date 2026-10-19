"use client";

import { useEffect, useRef, useState } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { EARTH_RADIUS } from "@/physics/constants";
import { getLiveState } from "../liveState";
import { measure, type Measurement } from "../measurements";
import { getScene, type SceneId } from "../scenes";
import { useLabStore } from "../store";

type Quantity = "position" | "speed" | "acceleration";

const SAMPLE_MS = 100;
const MAX_POINTS = 2000;
const HEIGHT_PX = 220;
const BODY_COLOR_VARS = ["--color-body-a", "--color-body-b", "--color-body-c"] as const;

/** Etiqueta del eje y factor para pasar de unidades SI a las que se muestran. */
function axisFor(sceneId: SceneId, quantity: Quantity): { label: string; factor: number } {
  if (sceneId === "tercer-cuerpo") {
    return {
      position: { label: "Distancia al centro", factor: 1 },
      speed: { label: "Velocidad", factor: 1 },
      acceleration: { label: "Aceleración", factor: 1 },
    }[quantity];
  }
  if (sceneId === "lanzamiento") {
    return {
      position: { label: "Altura (km)", factor: 1000 },
      speed: { label: "Velocidad (km/s)", factor: 1000 },
      acceleration: { label: "Aceleración (m/s²)", factor: 1 },
    }[quantity];
  }
  return {
    position: { label: "Altura (m)", factor: 1 },
    speed: { label: "Velocidad (m/s)", factor: 1 },
    acceleration: { label: "Aceleración (m/s²)", factor: 1 },
  }[quantity];
}

function valueOf(row: Measurement, quantity: Quantity): number {
  if (quantity === "position") return row.altitude ?? row.distance;
  return quantity === "speed" ? row.speed : row.acceleration;
}

interface History {
  key: string;
  times: number[];
  rows: Measurement[][];
}

export function LabChart() {
  const sceneId = useLabStore((state) => state.sceneId);
  const runId = useLabStore((state) => state.runId);
  const [quantity, setQuantity] = useState<Quantity>("position");
  const containerRef = useRef<HTMLDivElement>(null);
  // El historial vive fuera de React y sobrevive al cambio de magnitud:
  // pasar de "altura" a "velocidad" no borra lo ya registrado.
  const historyRef = useRef<History>({ key: "", times: [], rows: [] });
  const scene = getScene(sceneId);
  const isMeter = !scene.run;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const styles = getComputedStyle(document.documentElement);
    const css = (name: string) => styles.getPropertyValue(name).trim();
    const ink = css("--color-ink");
    const gridColor = css("--color-grid");
    const colors = BODY_COLOR_VARS.map(css);
    const axis = { stroke: ink, grid: { stroke: gridColor, width: 1 }, ticks: { stroke: gridColor, width: 1 } };
    const width = container.clientWidth || 600;
    const { params } = useLabStore.getState();

    // ── Altura: la curva de la ley, peso frente a distancia al centro ──
    if (isMeter) {
      const current = (EARTH_RADIUS + (params.altitude ?? 0) * 1000) / EARTH_RADIUS;
      const maxX = Math.max(10, current * 1.2);
      const xs = Array.from({ length: 301 }, (_, i) => 1 + ((maxX - 1) * i) / 300);
      xs.push(current);
      xs.sort((a, b) => a - b);
      const curve = xs.map((x) => 100 / (x * x));
      const point = xs.map((x) => (x === current ? 100 / (x * x) : null));

      const plot = new uPlot(
        {
          width,
          height: HEIGHT_PX,
          scales: { x: { time: false } },
          axes: [
            { ...axis, label: "Distancia al centro (radios terrestres)" },
            { ...axis, label: "Peso respecto al suelo (%)" },
          ],
          series: [
            {},
            { label: "Ley: 100 / r²", stroke: ink, width: 2 },
            { label: "Tu objeto", stroke: colors[0], points: { show: true, size: 10, fill: colors[0] }, paths: () => null },
          ],
          cursor: { show: false },
          // Solo nombres y colores: no hay cursor, así que no hay valor que mostrar.
          legend: { live: false },
        },
        [xs, curve, point],
        container,
      );
      const observer = new ResizeObserver(() => plot.setSize({ width: container.clientWidth, height: HEIGHT_PX }));
      observer.observe(container);
      return () => {
        observer.disconnect();
        plot.destroy();
      };
    }

    // ── Resto de escenas: la magnitud elegida frente al tiempo ──
    const history = historyRef.current;
    const key = `${sceneId}-${runId}`;
    if (history.key !== key) {
      history.key = key;
      history.times = [];
      history.rows = [];
    }

    const clock = scene.run!.clock;
    const { label, factor } = axisFor(sceneId, quantity);
    const moving = scene.buildBodies(params).filter((body) => body.id !== "tierra");

    const toData = (): uPlot.AlignedData => [
      history.times,
      ...moving.map((body) =>
        history.rows.map((rows) => {
          const row = rows.find((r) => r.id === body.id);
          return row ? valueOf(row, quantity) / factor : null;
        }),
      ),
    ];

    const plot = new uPlot(
      {
        width,
        height: HEIGHT_PX,
        scales: { x: { time: false } },
        axes: [{ ...axis, label: `Tiempo${clock.unit ? ` (${clock.unit})` : ""}` }, { ...axis, label }],
        series: [
          { label: "t" },
          ...moving.map((body, i) => ({ label: body.name, stroke: colors[i % colors.length], width: 2, points: { show: false } })),
        ],
        cursor: { show: false },
        legend: { live: false },
      },
      toData(),
      container,
    );

    // 10 muestras por segundo, leídas del estado en directo (sin pasar por React).
    const interval = setInterval(() => {
      const state = getLiveState();
      if (!state) return;
      const time = state.time / clock.secondsPerUnit;
      const last = history.times.at(-1);
      if (last !== undefined && time <= last) return;
      history.times.push(time);
      history.rows.push(measure(state.bodies, scene.G));
      if (history.times.length > MAX_POINTS) {
        history.times.shift();
        history.rows.shift();
      }
      plot.setData(toData());
    }, SAMPLE_MS);

    const observer = new ResizeObserver(() => plot.setSize({ width: container.clientWidth, height: HEIGHT_PX }));
    observer.observe(container);

    return () => {
      clearInterval(interval);
      observer.disconnect();
      plot.destroy();
    };
  }, [sceneId, runId, quantity, isMeter, scene]);

  return (
    <section aria-labelledby="grafica-titulo" className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="grafica-titulo" className="text-lg font-bold">
          Gráfica
        </h2>
        {!isMeter && (
          <label className="flex items-center gap-2">
            Magnitud
            <select
              value={quantity}
              onChange={(event) => setQuantity(event.target.value as Quantity)}
              className="border border-ink/40 bg-paper px-2 py-1"
            >
              <option value="position">{sceneId === "tercer-cuerpo" ? "Distancia al centro" : "Altura"}</option>
              <option value="speed">Velocidad</option>
              <option value="acceleration">Aceleración</option>
            </select>
          </label>
        )}
      </div>
      {/* Los valores exactos están en la tabla de datos; la gráfica muestra la forma. */}
      <div
        ref={containerRef}
        role="img"
        aria-label={
          isMeter
            ? "Gráfica de la ley: el peso baja con el cuadrado de la distancia al centro. Los valores exactos están en la tabla de datos."
            : "Gráfica de la magnitud elegida frente al tiempo. Los valores exactos están en la tabla de datos."
        }
        className="mt-2 w-full"
      />
    </section>
  );
}
