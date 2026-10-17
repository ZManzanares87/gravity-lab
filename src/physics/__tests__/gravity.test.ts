import { describe, expect, it } from "vitest";
import { EARTH_MASS, EARTH_RADIUS, G_SI } from "../constants";
import { accelerations, forceBetween } from "../gravity";
import type { Body } from "../types";
import { length, vec, ZERO } from "../vec2";

function body(id: string, mass: number, x: number, y = 0): Body {
  return { id, name: id, mass, radius: 0, position: vec(x, y), velocity: ZERO };
}

const earth = body("earth", EARTH_MASS, 0);

describe("gravity", () => {
  it("da una aceleración de ~9,8 m/s² en la superficie terrestre", () => {
    const ball = body("ball", 1, EARTH_RADIUS);
    const [, aBall] = accelerations([earth, ball], G_SI);
    expect(length(aBall!)).toBeCloseTo(9.82, 1);
  });

  it("la aceleración no depende de la masa del propio cuerpo", () => {
    const tennis = body("tennis", 0.058, EARTH_RADIUS);
    const bowling = body("bowling", 7, EARTH_RADIUS);
    const [, aTennis] = accelerations([earth, tennis], G_SI);
    const [, aBowling] = accelerations([earth, bowling], G_SI);
    expect(length(aTennis!)).toBeCloseTo(length(aBowling!), 10);
  });

  it("al doble de distancia, la fuerza es la cuarta parte", () => {
    const near = forceBetween(earth, body("b", 1, EARTH_RADIUS), G_SI);
    const far = forceBetween(earth, body("b", 1, 2 * EARTH_RADIUS), G_SI);
    expect(far / near).toBeCloseTo(0.25, 10);
  });

  it("cumple la tercera ley: fuerzas iguales y opuestas", () => {
    const a = body("a", 3, 0);
    const b = body("b", 5, 2, 1);
    const [aA, aB] = accelerations([a, b], 1);
    // F = m · a; la suma de las dos fuerzas debe ser cero.
    expect(a.mass * aA!.x + b.mass * aB!.x).toBeCloseTo(0, 12);
    expect(a.mass * aA!.y + b.mass * aB!.y).toBeCloseTo(0, 12);
  });
});
