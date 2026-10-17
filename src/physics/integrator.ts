import { accelerations } from "./gravity";
import type { Body, Vec2 } from "./types";
import { add, scale } from "./vec2";

/**
 * Estado que necesita el integrador entre un paso y el siguiente:
 * los cuerpos y sus aceleraciones actuales. Guardar las aceleraciones
 * permite calcular la gravedad una sola vez por paso.
 */
export interface IntegratorState {
  readonly bodies: readonly Body[];
  readonly accelerations: readonly Vec2[];
}

/** Prepara el estado inicial calculando las primeras aceleraciones. */
export function startIntegrator(bodies: readonly Body[], G: number): IntegratorState {
  return { bodies, accelerations: accelerations(bodies, G) };
}

/**
 * Un paso de Verlet de velocidad, en su forma "impulso-desplazamiento-impulso":
 *   1. Medio impulso:   v ← v + a·dt/2
 *   2. Desplazamiento:  x ← x + v·dt
 *   3. Nuevas aceleraciones en las posiciones nuevas
 *   4. Medio impulso:   v ← v + a_nueva·dt/2
 *
 * Al repartir la velocidad en dos mitades alrededor del desplazamiento,
 * el error no se acumula en una sola dirección y la energía se conserva
 * a largo plazo: las órbitas no se abren en espiral.
 */
export function verletStep(current: IntegratorState, G: number, dt: number): IntegratorState {
  const halfDt = dt / 2;

  const moved = current.bodies.map((body, i) => {
    const halfVelocity = add(body.velocity, scale(at(current.accelerations, i), halfDt));
    return {
      ...body,
      position: add(body.position, scale(halfVelocity, dt)),
      velocity: halfVelocity,
    };
  });

  const newAccelerations = accelerations(moved, G);

  const bodies = moved.map((body, i) => ({
    ...body,
    velocity: add(body.velocity, scale(at(newAccelerations, i), halfDt)),
  }));

  return { bodies, accelerations: newAccelerations };
}

/**
 * Lee la posición i de una lista que, por construcción, tiene un elemento
 * por cuerpo. Si faltara, es un error de programación: mejor fallar con un
 * mensaje claro que seguir con un valor inventado.
 */
function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`Integrador: falta el elemento ${index}`);
  }
  return item;
}
