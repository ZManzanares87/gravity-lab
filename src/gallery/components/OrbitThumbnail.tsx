import type { Vec2 } from "@/physics/types";
import { trajectoryBounds, type Trajectory } from "../trajectory";

/** Un color por cuerpo, en el mismo orden que los cuerpos (A, B, C). */
const BODY_STROKES = ["stroke-body-a", "stroke-body-b", "stroke-body-c"] as const;
const BODY_FILLS = ["fill-body-a", "fill-body-b", "fill-body-c"] as const;

/**
 * Convierte los puntos en el atributo "d" de un <path> de SVG.
 * En física, la y crece hacia arriba; en SVG, hacia abajo: por eso -y.
 */
function toSvgPath(points: readonly Vec2[]): string {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(4)},${(-p.y).toFixed(4)}`)
    .join(" ");
}

/**
 * Dibujo estático de una órbita completa. Es un componente de servidor:
 * llega al navegador como SVG ya generado, sin JavaScript.
 * Es decorativo (aria-hidden): el nombre y la descripción de la tarjeta
 * ya dicen qué es.
 */
export function OrbitThumbnail({ trajectory }: { trajectory: Trajectory }) {
  const { minX, minY, maxX, maxY } = trajectoryBounds(trajectory);
  const width = maxX - minX;
  const height = maxY - minY;
  const size = Math.max(width, height);
  const padding = 0.08 * size;

  // El eje y se invierte, así que la parte superior del dibujo es -maxY.
  const viewBox = [minX - padding, -maxY - padding, width + 2 * padding, height + 2 * padding]
    .map((n) => n.toFixed(4))
    .join(" ");

  return (
    <svg viewBox={viewBox} aria-hidden="true" className="h-full w-full">
      {trajectory.map((points, i) => (
        <path
          key={`path-${i}`}
          d={toSvgPath(points)}
          fill="none"
          className={BODY_STROKES[i % BODY_STROKES.length]}
          strokeWidth={1.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/*
       * Punto de salida de cada cuerpo. En Lagrange y la Figura de ocho los
       * tres recorren la misma curva y sus líneas se superponen: sin los
       * puntos, no se vería que hay tres cuerpos.
       */}
      {trajectory.map((points, i) => {
        const start = points[0];
        if (!start) return null;
        return (
          <circle
            key={`start-${i}`}
            cx={start.x}
            cy={-start.y}
            r={0.035 * size}
            className={`${BODY_FILLS[i % BODY_FILLS.length]} stroke-paper`}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}
