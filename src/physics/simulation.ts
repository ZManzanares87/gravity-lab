import { findContact, resolveContact } from "./collisions";
import { startIntegrator, verletStep, type IntegratorState } from "./integrator";
import type { Body, Contact, PhysicsConfig, SimState } from "./types";

/** Una simulación en marcha: configuración, reloj y estado del integrador. */
export interface Simulation {
  readonly config: PhysicsConfig;
  readonly time: number;
  readonly integrator: IntegratorState;
}

export interface AdvanceResult {
  readonly simulation: Simulation;
  /** Si hubo contacto, la simulación se detuvo en ese paso. */
  readonly contact: Contact | null;
}

export function createSimulation(bodies: readonly Body[], config: PhysicsConfig): Simulation {
  return { config, time: 0, integrator: startIntegrator(bodies, config.G) };
}

/**
 * Avanza la simulación un número de pasos fijos. Si dos cuerpos se tocan,
 * resuelve el contacto y se detiene en ese mismo paso: quien la usa debe
 * pausar y anunciarlo.
 */
export function advance(simulation: Simulation, steps: number): AdvanceResult {
  const { G, dt } = simulation.config;
  let integrator = simulation.integrator;
  let time = simulation.time;

  for (let i = 0; i < steps; i++) {
    integrator = verletStep(integrator, G, dt);
    time += dt;

    const pair = findContact(integrator.bodies);
    if (pair) {
      const resolved = resolveContact(integrator.bodies, pair);
      return {
        // Tras mover un cuerpo, las aceleraciones guardadas ya no valen: se recalculan.
        simulation: { ...simulation, time, integrator: startIntegrator(resolved.bodies, G) },
        contact: { bodyId: resolved.landed.id, otherBodyId: resolved.base.id, time },
      };
    }
  }

  return { simulation: { ...simulation, time, integrator }, contact: null };
}

/** La foto del instante actual, para dibujar o enviar a la IA. */
export function snapshot(simulation: Simulation): SimState {
  return { time: simulation.time, bodies: simulation.integrator.bodies };
}
