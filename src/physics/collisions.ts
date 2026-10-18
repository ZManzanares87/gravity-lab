import type { Body } from "./types";
import { add, length, scale, sub, vec } from "./vec2";

/** Dos cuerpos que se están tocando. */
export interface ContactPair {
  readonly first: Body;
  readonly second: Body;
}

/**
 * Todas las parejas de cuerpos que se tocan: la distancia entre sus centros
 * es menor que la suma de sus radios. Los cuerpos puntuales (radio 0)
 * nunca entran en contacto entre sí.
 */
export function findContacts(bodies: readonly Body[]): ContactPair[] {
  const pairs: ContactPair[] = [];
  for (const [i, first] of bodies.entries()) {
    for (const second of bodies.slice(i + 1)) {
      const minDistance = first.radius + second.radius;
      if (minDistance > 0 && length(sub(second.position, first.position)) < minDistance) {
        pairs.push({ first, second });
      }
    }
  }
  return pairs;
}

/** Un cuerpo que ha quedado apoyado sobre otro. */
export interface Landing {
  /** El cuerpo más ligero, que queda apoyado. */
  readonly landedId: string;
  /** El cuerpo más pesado, sobre el que se apoya. */
  readonly baseId: string;
}

/**
 * Regla de contacto de la especificación: en cada pareja, el cuerpo más
 * ligero se coloca justo sobre la superficie del más pesado y se mueve con él.
 * Es una simplificación: el contacto no forma parte del modelo gravitatorio.
 */
export function resolveContacts(
  bodies: readonly Body[],
  pairs: readonly ContactPair[],
): { bodies: Body[]; landings: Landing[] } {
  let current = [...bodies];
  const landings: Landing[] = [];

  for (const { first, second } of pairs) {
    const [baseId, lightId] =
      first.mass >= second.mass ? [first.id, second.id] : [second.id, first.id];
    // Se leen de la lista actual: una pareja anterior pudo mover alguno de los dos.
    const base = current.find((body) => body.id === baseId);
    const light = current.find((body) => body.id === lightId);
    if (!base || !light) continue;

    const offset = sub(light.position, base.position);
    const distance = length(offset);
    const direction = distance === 0 ? vec(0, 1) : scale(offset, 1 / distance);
    const landed: Body = {
      ...light,
      position: add(base.position, scale(direction, base.radius + light.radius)),
      velocity: base.velocity,
    };

    current = current.map((body) => (body.id === landed.id ? landed : body));
    landings.push({ landedId: landed.id, baseId: base.id });
  }

  return { bodies: current, landings };
}
