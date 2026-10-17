import { describe, expect, it } from "vitest";
import { totalEnergy } from "../energy";
import { startIntegrator, verletStep, type IntegratorState } from "../integrator";
import type { Body } from "../types";
import { length, sub, vec, ZERO } from "../vec2";

function run(state: IntegratorState, G: number, dt: number, steps: number): IntegratorState {
  let current = state;
  for (let i = 0; i < steps; i++) current = verletStep(current, G, dt);
  return current;
}

describe("integrador Verlet", () => {
  it("una órbita circular vuelve a su punto de partida tras un periodo", () => {
    // Unidades abstractas: G = 1, masa central = 1, radio = 1.
    // Velocidad circular: √(G·M/r) = 1. Periodo: 2π·r / v = 2π.
    const star: Body = { id: "star", name: "Estrella", mass: 1, radius: 0, position: ZERO, velocity: ZERO };
    const planet: Body = { id: "planet", name: "Planeta", mass: 1e-9, radius: 0, position: vec(1, 0), velocity: vec(0, 1) };

    const dt = 1e-3;
    const final = run(startIntegrator([star, planet], 1), 1, dt, Math.round((2 * Math.PI) / dt));

    const [, finalPlanet] = final.bodies;
    expect(length(sub(finalPlanet!.position, planet.position))).toBeLessThan(1e-3);
  });

  it("conserva la energía en la Figura de ocho durante un periodo", () => {
    // Condiciones de Chenciner y Montgomery (2000), calculadas por C. Simó.
    const v3 = vec(-0.93240737, -0.86473146);
    const bodies: Body[] = [
      { id: "1", name: "1", mass: 1, radius: 0, position: vec(-0.97000436, 0.24308753), velocity: vec(-v3.x / 2, -v3.y / 2) },
      { id: "2", name: "2", mass: 1, radius: 0, position: vec(0.97000436, -0.24308753), velocity: vec(-v3.x / 2, -v3.y / 2) },
      { id: "3", name: "3", mass: 1, radius: 0, position: ZERO, velocity: v3 },
    ];

    const initialEnergy = totalEnergy(bodies, 1);
    const dt = 1e-4;
    const final = run(startIntegrator(bodies, 1), 1, dt, Math.round(6.3259 / dt));
    const drift = Math.abs((totalEnergy(final.bodies, 1) - initialEnergy) / initialEnergy);

    expect(drift).toBeLessThan(1e-6);
  });
});
