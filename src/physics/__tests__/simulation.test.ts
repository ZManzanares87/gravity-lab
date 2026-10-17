import { describe, expect, it } from "vitest";
import { findContact } from "../collisions";
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

function dropBall(mass: number) {
  const ball: Body = {
    id: "ball",
    name: "Bola",
    mass,
    radius: BALL_RADIUS,
    position: vec(0, EARTH_RADIUS + BALL_RADIUS + HEIGHT),
    velocity: ZERO,
  };
  const simulation = createSimulation([earth, ball], { G: G_SI, dt: 1e-3 });
  return advance(simulation, 10_000);
}

describe("simulación", () => {
  it("una bola soltada desde 10 m llega al suelo en el tiempo esperado", () => {
    // Caída libre: t = √(2h / g), con g = G·M / R².
    const g = (G_SI * EARTH_MASS) / EARTH_RADIUS ** 2;
    const expected = Math.sqrt((2 * HEIGHT) / g);

    const { contact } = dropBall(1);
    expect(contact).not.toBeNull();
    expect(contact!.time).toBeCloseTo(expected, 2);
  });

  it("una bola de bolos y una pelota de tenis llegan a la vez (experimento 1)", () => {
    const tennis = dropBall(0.058);
    const bowling = dropBall(7);
    expect(tennis.contact!.time).toBeCloseTo(bowling.contact!.time, 6);
  });

  it("tras el contacto, la bola queda apoyada en la superficie y se mueve con la Tierra", () => {
    const { simulation, contact } = dropBall(1);
    expect(contact!.bodyId).toBe("ball");

    const [finalEarth, ball] = snapshot(simulation).bodies;
    // Distancia entre centros = radio de la Tierra + radio de la bola.
    expect(length(sub(ball!.position, finalEarth!.position))).toBeCloseTo(
      EARTH_RADIUS + BALL_RADIUS,
      6,
    );
    // Misma velocidad que la Tierra: la bola también la atrae a ella (tercera ley),
    // así que la Tierra se ha movido un poquito y la bola se mueve con ella.
    expect(ball!.velocity).toEqual(finalEarth!.velocity);
  });

  it("los cuerpos puntuales nunca entran en contacto", () => {
    const a: Body = { id: "a", name: "a", mass: 1, radius: 0, position: ZERO, velocity: ZERO };
    const b: Body = { id: "b", name: "b", mass: 1, radius: 0, position: vec(1e-9, 0), velocity: ZERO };
    expect(findContact([a, b])).toBeNull();
  });
});
