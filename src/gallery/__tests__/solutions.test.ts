import { describe, expect, it } from "vitest";
import { totalEnergy } from "@/physics/energy";
import { advance, createSimulation, snapshot } from "@/physics/simulation";
import { length, sub } from "@/physics/vec2";
import { GALLERY_PHYSICS, SOLUTIONS } from "../solutions";

describe("soluciones de los tres cuerpos", () => {
  it("hay seis soluciones con slugs únicos", () => {
    expect(SOLUTIONS).toHaveLength(6);
    expect(new Set(SOLUTIONS.map((s) => s.slug)).size).toBe(6);
  });

  it.each(SOLUTIONS)("$name vuelve a su punto de partida tras un periodo", (solution) => {
    const { G, dt } = GALLERY_PHYSICS;
    const start = createSimulation(solution.bodies, GALLERY_PHYSICS);
    const { simulation } = advance(start, Math.round(solution.period / dt));
    const final = snapshot(simulation).bodies;

    // Error de cierre: la mayor distancia entre la posición final e inicial de un cuerpo.
    const closureError = Math.max(
      ...final.map((body, i) => length(sub(body.position, solution.bodies[i]!.position))),
    );
    const initialEnergy = totalEnergy(solution.bodies, G);
    const energyDrift = Math.abs((totalEnergy(final, G) - initialEnergy) / initialEnergy);

    console.info(
      `${solution.name}: cierre ${closureError.toExponential(2)}, energía ${energyDrift.toExponential(2)}`,
    );

    expect(closureError).toBeLessThan(1e-2);
    expect(energyDrift).toBeLessThan(1e-6);
  });
});
