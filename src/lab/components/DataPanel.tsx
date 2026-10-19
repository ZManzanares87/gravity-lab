"use client";

import { useEffect, useState } from "react";
import type { SimState } from "@/physics/types";
import { formatDistance, formatNumber, formatQuantity, formatScientific } from "../format";
import { getLiveState } from "../liveState";
import { measure } from "../measurements";
import { getScene } from "../scenes";
import { useLabStore } from "../store";


function formatSpeed(metersPerSecond: number): string {
  return metersPerSecond >= 1000
    ? `${formatNumber(metersPerSecond / 1000, 3)} km/s`
    : `${formatNumber(metersPerSecond, 3)} m/s`;
}

export function DataPanel() {
  const sceneId = useLabStore((state) => state.sceneId);
  const [state, setState] = useState<SimState | null>(null);

  // 4 lecturas por segundo: suficiente para leer, sin re-renderizar en cada fotograma.
  useEffect(() => {
    const interval = setInterval(() => setState(getLiveState()), 250);
    return () => clearInterval(interval);
  }, []);

  if (!state) return null;

  const scene = getScene(sceneId);
  const central = state.bodies.find((body) => body.id === "tierra");
  const rows = measure(state.bodies, scene.G);
  const isAltitude = sceneId === "altura";

  return (
    <section aria-labelledby="datos-titulo" className="mt-6">
      <h2 id="datos-titulo" className="text-lg font-bold">
        Datos
      </h2>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left tabular-nums">
          <thead className="text-ink-soft">
            <tr>
              <th scope="col" className="pr-4 font-normal">Cuerpo</th>
              <th scope="col" className="pr-4 font-normal">Masa</th>
              <th scope="col" className="pr-4 font-normal">{central ? "Altura" : "Distancia al centro"}</th>
              {isAltitude && <th scope="col" className="pr-4 font-normal">Distancia al centro</th>}
              <th scope="col" className="pr-4 font-normal">Velocidad</th>
              <th scope="col" className="pr-4 font-normal">Aceleración</th>
              <th scope="col" className="pr-4 font-normal">{central ? "Peso" : "Fuerza"}</th>
              {isAltitude && <th scope="col" className="font-normal">Peso respecto al suelo</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row" className="pr-4 font-bold">{row.name}</th>
                <td className="pr-4">{central ? `${formatQuantity(row.mass)} kg` : formatNumber(row.mass)}</td>
                <td className="pr-4">
                  {central && row.altitude !== null ? formatDistance(row.altitude) : formatNumber(row.distance)}
                </td>
                {isAltitude && <td className="pr-4">{formatDistance(row.distance)}</td>}
                <td className="pr-4">{central ? formatSpeed(row.speed) : formatNumber(row.speed)}</td>
                <td className="pr-4">
                  {central ? `${formatQuantity(row.acceleration)} m/s²` : formatNumber(row.acceleration)}
                </td>
                <td className="pr-4">{central ? `${formatQuantity(row.force)} N` : formatNumber(row.force)}</td>
                {isAltitude && central && (
                  <td>
                    {formatNumber(
                      (100 * row.force) / ((scene.G * central.mass * row.mass) / central.radius ** 2),
                      3,
                    )}{" "}
                    %
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {central ? (
        <div className="mt-4 space-y-2">
          {rows.map((row) => (
            <p key={row.id} className="tabular-nums">
              Peso de {row.name.toLowerCase()} = G · M · m / r² ={" "}
              {formatScientific(scene.G)} × {formatScientific(central.mass)} × {formatQuantity(row.mass)} / (
              {formatScientific(row.distance)} m)² ={" "}
              <strong>
                {formatQuantity((scene.G * central.mass * row.mass) / row.distance ** 2)} N
              </strong>
            </p>
          ))}
          <p className="text-ink-soft">
            M es la masa de la Tierra ({formatScientific(central.mass)} kg) y r, la distancia entre
            los centros. La masa de la Tierra no cambia en el laboratorio, pero cuenta igual que la
            del objeto: si fuera el doble, todos los pesos serían el doble.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-ink-soft">
          Unidades abstractas, como en la galería: G = 1. Las fuerzas se suman: cada estrella tira
          de las demás a la vez.
        </p>
      )}
    </section>
  );
}
