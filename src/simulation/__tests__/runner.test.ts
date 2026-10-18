import { describe, expect, it } from "vitest";
import { EARTH_MASS, EARTH_RADIUS, G_SI } from "@/physics/constants";
import type { Body, SimState } from "@/physics/types";
import { vec, ZERO } from "@/physics/vec2";
import { SimulationRunner, type FrameScheduler } from "../runner";

/** Planificador manual: guarda el callback y lo ejecuta cuando el test lo pide. */
function manualScheduler() {
  let pending: ((timestamp: number) => void) | null = null;
  let now = 0;
  const scheduler: FrameScheduler = {
    request: (callback) => {
      pending = callback;
      return 1;
    },
    cancel: () => {
      pending = null;
    },
  };
  /** Avanza un fotograma de `ms` milisegundos. */
  const frame = (ms: number) => {
    const callback = pending;
    pending = null;
    now += ms;
    callback?.(now);
  };
  return { scheduler, frame, isWaiting: () => pending !== null };
}

const star: Body = { id: "star", name: "Estrella", mass: 1, radius: 0, position: ZERO, velocity: ZERO };
const planet: Body = { id: "planet", name: "Planeta", mass: 1e-9, radius: 0, position: vec(1, 0), velocity: vec(0, 1) };

describe("SimulationRunner", () => {
  it("convierte tiempo real en tiempo simulado según la escala", () => {
    const { scheduler, frame } = manualScheduler();
    let last: SimState | null = null;
    const runner = new SimulationRunner({
      bodies: [star, planet],
      physics: { G: 1, dt: 1e-3 },
      timeScale: 2,
      onFrame: (state) => (last = state),
      scheduler,
    });

    runner.play();
    frame(16); // el primer fotograma solo toma la referencia de tiempo
    frame(50); // 0,05 s reales × escala 2 = 0,1 de tiempo simulado
    expect(last!.time).toBeCloseTo(0.1, 6);
  });

  it("vuelve al inicio al completar el periodo", () => {
    const { scheduler, frame } = manualScheduler();
    let last: SimState | null = null;
    const runner = new SimulationRunner({
      bodies: [star, planet],
      physics: { G: 1, dt: 1e-3 },
      timeScale: 1,
      loopAt: 0.25,
      onFrame: (state) => (last = state),
      scheduler,
    });

    runner.play();
    frame(16);
    frame(100); // t = 0,1
    frame(100); // t = 0,2
    frame(100); // cruza 0,25: vuelve a t = 0
    expect(last!.time).toBe(0);
    expect(last!.bodies[1]!.position).toEqual(planet.position);
  });

  it("se pausa y avisa cuando hay contacto", () => {
    const { scheduler, frame, isWaiting } = manualScheduler();
    const earth: Body = { id: "earth", name: "Tierra", mass: EARTH_MASS, radius: EARTH_RADIUS, position: ZERO, velocity: ZERO };
    const ball: Body = { id: "ball", name: "Bola", mass: 1, radius: 0.1, position: vec(0, EARTH_RADIUS + 0.2), velocity: ZERO };
    let contactWith: string | null = null;

    const runner = new SimulationRunner({
      bodies: [earth, ball],
      physics: { G: G_SI, dt: 1e-3 },
      timeScale: 1,
      onFrame: () => {},
      onContacts: (contacts) => (contactWith = contacts[0]?.otherBodyId ?? null),
      scheduler,
    });

    runner.play();
    frame(16);
    for (let i = 0; i < 20 && runner.isRunning; i++) frame(100);

    expect(contactWith).toBe("earth");
    expect(runner.isRunning).toBe(false);
    expect(isWaiting()).toBe(false);
  });
});
