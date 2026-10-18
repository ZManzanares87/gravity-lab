import { describe, expect, it } from "vitest";
import { findContacts } from "../collisions";
import { EARTH_MASS, EARTH_RADIUS, G_SI } from "../constants";
import { advance, createSimulation, snapshot } from "../simulation";
import type { Body } from "../types";
import { length, sub, vec, ZERO } from "../vec2";

const earth: Body = {
  id: "earth",
  name: "Tierra",
  mass: EARTH_MASS,
  radius: EARTH_RADIUS,
  position: ZERO,
  velocity: ZERO,
};

const BALL_RADIUS = 0.1;
const HEIGHT = 10;

function ball(id: string, mass: number, x = 0): Body {
  return {
    id,
    name: id,
    mass,
    radius: BALL_RADIUS,
    position: vec(x, EARTH_RADIUS + BALL_RADIUS + HEIGHT),
    velocity: ZERO,
  };
}

function drop(...balls: Body[]) {
  const simulation = createSimulation([earth, ...balls], { G: G_SI, dt: 1e-3 });
  return advance(simulation, 10_000);
}

describe("simulación", () => {
  it("una bola soltada desde 10 m llega al suelo en el tiempo esperado", () => {
    // Caída libre: t = √(2h / g), con g = G·M / R².
    const g = (G_SI * EARTH_MASS) / EARTH_RADIUS ** 2;
    const expected = Math.sqrt((2 * HEIGHT) / g);

    const { contacts } = drop(ball("ball", 1));
    expect(contacts).toHaveLength(1);
    expect(contacts[0]!.time).toBeCloseTo(expected, 2);
  });

  it("una bola de bolos y una pelota de tenis llegan a la vez (experimento 1)", () => {
    const { contacts } = drop(ball("bowling", 7, -1), ball("tennis", 0.058, 1));
    // Las dos tocan el suelo en el mismo paso: el motor devuelve los dos contactos.
    expect(contacts.map((c) => c.bodyId).sort()).toEqual(["bowling", "tennis"]);
    expect(contacts[0]!.time).toBe(contacts[1]!.time);
  });

  it("tras el contacto, la bola queda apoyada en la superficie y se mueve con la Tierra", () => {
    const { simulation, contacts } = drop(ball("ball", 1));
    expect(contacts[0]!.bodyId).toBe("ball");
    expect(contacts[0]!.otherBodyId).toBe("earth");

    const [finalEarth, finalBall] = snapshot(simulation).bodies;
    // Distancia entre centros = radio de la Tierra + radio de la bola.
    expect(length(sub(finalBall!.position, finalEarth!.position))).toBeCloseTo(
      EARTH_RADIUS + BALL_RADIUS,
      6,
    );
    // Misma velocidad que la Tierra: la bola también la atrae a ella (tercera ley),
    // así que la Tierra se ha movido un poquito y la bola se mueve con ella.
    expect(finalBall!.velocity).toEqual(finalEarth!.velocity);
  });

  it("sin contacto, la lista de contactos está vacía", () => {
    const simulation = createSimulation([earth, ball("ball", 1)], { G: G_SI, dt: 1e-3 });
    expect(advance(simulation, 10).contacts).toEqual([]);
  });

  it("los cuerpos puntuales nunca entran en contacto", () => {
    const a: Body = { id: "a", name: "a", mass: 1, radius: 0, position: ZERO, velocity: ZERO };
    const b: Body = { id: "b", name: "b", mass: 1, radius: 0, position: vec(1e-9, 0), velocity: ZERO };
    expect(findContacts([a, b])).toEqual([]);
  });
});
