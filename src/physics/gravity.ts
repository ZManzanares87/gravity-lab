import type { Body, Vec2 } from "./types";
import { add, lengthSquared, scale, sub, ZERO } from "./vec2";

/**
 * Fuerza gravitatoria entre dos cuerpos: F = G · m1 · m2 / r².
 * Se usa para mostrar el valor en pantalla, no para mover los cuerpos.
 */
export function forceBetween(a: Body, b: Body, G: number): number {
  const r2 = lengthSquared(sub(b.position, a.position));
  if (r2 === 0) return 0;
  return (G * a.mass * b.mass) / r2;
}

/**
 * Aceleración de cada cuerpo debida a la atracción de todos los demás.
 *
 * Por la segunda ley de Newton (a = F / m), la masa del propio cuerpo
 * se cancela: su aceleración solo depende de la masa de los OTROS.
 * Por eso una bola de bolos y una pelota de tenis caen igual.
 *
 * Devuelve las aceleraciones en el mismo orden que los cuerpos.
 */
export function accelerations(bodies: readonly Body[], G: number, softening = 0): Vec2[] {
  return bodies.map((body) =>
    bodies.reduce<Vec2>((total, other) => {
      if (other === body) return total;

      const delta = sub(other.position, body.position);
      // Con suavizado, la fuerza no crece sin límite cuando dos cuerpos casi se tocan.
      const r2 = lengthSquared(delta) + softening * softening;
      // Dos cuerpos en el mismo punto exacto: la fórmula daría infinito.
      if (r2 === 0) return total;

      // Módulo G·m/r², en la dirección de delta (delta / r): G·m·delta / r³.
      const r = Math.sqrt(r2);
      return add(total, scale(delta, (G * other.mass) / (r2 * r)));
    }, ZERO),
  );
}
