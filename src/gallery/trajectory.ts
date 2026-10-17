import { advance, createSimulation, snapshot } from "@/physics/simulation";
import type { Vec2 } from "@/physics/types";
import { GALLERY_PHYSICS, type ThreeBodySolution } from "./solutions";

/** Puntos recorridos por cada cuerpo, en el mismo orden que los cuerpos. */
export type Trajectory = readonly (readonly Vec2[])[];

export interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/**
 * Simula un periodo completo y guarda la posición de cada cuerpo en
 * `samples` momentos repartidos por igual. Con 400 muestras, el dibujo
 * se ve suave sin generar un SVG pesado.
 */
export function sampleTrajectory(solution: ThreeBodySolution, samples = 400): Trajectory {
  const totalSteps = Math.round(solution.period / GALLERY_PHYSICS.dt);
  const stepsPerSample = Math.max(1, Math.floor(totalSteps / samples));

  let simulation = createSimulation(solution.bodies, GALLERY_PHYSICS);
  const paths: Vec2[][] = solution.bodies.map((body) => [body.position]);

  for (let sample = 0; sample < samples; sample++) {
    simulation = advance(simulation, stepsPerSample).simulation;
    snapshot(simulation).bodies.forEach((body, i) => paths[i]?.push(body.position));
  }

  return paths;
}

/** El rectángulo que contiene todos los puntos de la trayectoria. */
export function trajectoryBounds(trajectory: Trajectory): Bounds {
  const points = trajectory.flat();
  return {
    minX: Math.min(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxX: Math.max(...points.map((p) => p.x)),
    maxY: Math.max(...points.map((p) => p.y)),
  };
}
