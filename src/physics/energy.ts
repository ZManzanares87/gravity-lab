import type { Body } from "./types";
import { length, lengthSquared, sub } from "./vec2";

/**
 * Energía total del sistema: cinética + potencial gravitatoria.
 *
 * En un sistema donde solo actúa la gravedad, la energía total no cambia.
 * Por eso sirve para medir lo bien que trabaja el integrador: cuanto menos
 * varíe, más fiel es la simulación. La usan los tests para comprobar que
 * el integrador conserva la energía a lo largo de la simulación.
 */
export function totalEnergy(bodies: readonly Body[], G: number): number {
  const kinetic = bodies.reduce(
    (sum, body) => sum + 0.5 * body.mass * lengthSquared(body.velocity),
    0,
  );

  // Cada pareja se cuenta una sola vez: A con B, pero no B con A.
  const potential = bodies.reduce(
    (sum, a, i) =>
      sum +
      bodies.slice(i + 1).reduce((pairSum, b) => {
        const r = length(sub(b.position, a.position));
        return r === 0 ? pairSum : pairSum - (G * a.mass * b.mass) / r;
      }, 0),
    0,
  );

  return kinetic + potential;
}
