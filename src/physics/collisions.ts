import type { Body } from "./types";
import { add, length, scale, sub, vec } from "./vec2";

/** Dos cuerpos que se están tocando. */
export interface ContactPair {
  readonly first: Body;
  readonly second: Body;
}

/**
 * Busca la primera pareja de cuerpos que se toca: la distancia entre sus
 * centros es menor que la suma de sus radios. Los cuerpos puntuales
 * (radio 0) nunca entran en contacto entre sí.
 */
export function findContact(bodies: readonly Body[]): ContactPair | null {
  for (const [i, first] of bodies.entries()) {
    for (const second of bodies.slice(i + 1)) {
      const minDistance = first.radius + second.radius;
      if (minDistance > 0 && length(sub(second.position, first.position)) < minDistance) {
        return { first, second };
      }
    }
  }
  return null;
}

export interface ResolvedContact {
  readonly bodies: Body[];
  /** El cuerpo que ha quedado apoyado (el más ligero). */
  readonly landed: Body;
  /** El cuerpo sobre el que se apoya (el más pesado). */
  readonly base: Body;
}

/**
 * Regla de contacto de la especificación: el cuerpo más ligero se coloca
 * justo sobre la superficie del más pesado y se mueve con él.
 * Es una simplificación: el contacto no forma parte del modelo gravitatorio.
 */
export function resolveContact(bodies: readonly Body[], pair: ContactPair): ResolvedContact {
  const [base, light] =
    pair.first.mass >= pair.second.mass ? [pair.first, pair.second] : [pair.second, pair.first];

  const offset = sub(light.position, base.position);
  const distance = length(offset);
  const direction = distance === 0 ? vec(0, 1) : scale(offset, 1 / distance);

  const landed: Body = {
    ...light,
    position: add(base.position, scale(direction, base.radius + light.radius)),
    velocity: base.velocity,
  };

  return {
    bodies: bodies.map((body) => (body.id === landed.id ? landed : body)),
    landed,
    base,
  };
}
