import { findContacts, resolveContacts } from "./collisions";
import { startIntegrator, yoshidaStep, type IntegratorState } from "./integrator";
import type { Body, Contact, PhysicsConfig, SimState } from "./types";

/** Una simulación en marcha: configuración, reloj y estado del integrador. */
export interface Simulation {
  readonly config: PhysicsConfig;
  readonly time: number;
  readonly integrator: IntegratorState;
}

export interface AdvanceResult {
  readonly simulation: Simulation;
  /** Contactos del paso en que se detuvo. Vacío si no hubo ninguno. */
  readonly contacts: readonly Contact[];
}

export function createSimulation(bodies: readonly Body[], config: PhysicsConfig): Simulation {
  return { config, time: 0, integrator: startIntegrator(bodies, config.G, config.softening) };
}

/**
 * Avanza la simulación un número de pasos fijos. Si hay contactos, los
 * resuelve todos y se detiene en ese mismo paso: quien la usa debe pausar
 * y anunciarlos.
 */
export function advance(simulation: Simulation, steps: number): AdvanceResult {
  const { G, dt } = simulation.config;
  let integrator = simulation.integrator;
  let time = simulation.time;

  for (let i = 0; i < steps; i++) {
    integrator = yoshidaStep(integrator, G, dt, simulation.config.softening);
    time += dt;

    // El contacto se comprueba tras el paso completo, nunca entre los
    // subpasos de Yoshida (uno de ellos retrocede en el tiempo).
    const pairs = findContacts(integrator.bodies);
    if (pairs.length > 0) {
      const resolved = resolveContacts(integrator.bodies, pairs);
      return {
        // Tras mover cuerpos, las aceleraciones guardadas ya no valen: se recalculan.
        simulation: { ...simulation, time, integrator: startIntegrator(resolved.bodies, G, simulation.config.softening) },
        contacts: resolved.landings.map(({ landedId, baseId }) => ({
          bodyId: landedId,
          otherBodyId: baseId,
          time,
        })),
      };
    }
  }

  return { simulation: { ...simulation, time, integrator }, contacts: [] };
}

/** La foto del instante actual, para dibujar o enviar a la IA. */
export function snapshot(simulation: Simulation): SimState {
  return { time: simulation.time, bodies: simulation.integrator.bodies };
}
