import { advance, createSimulation, snapshot, type Simulation } from "@/physics/simulation";
import type { Body, Contact, PhysicsConfig, SimState } from "@/physics/types";

/**
 * Quién avisa de cada fotograma. En el navegador es requestAnimationFrame;
 * en los tests, una versión manual que avanza cuando el test lo decide.
 */
export interface FrameScheduler {
  request(callback: (timestamp: number) => void): number;
  cancel(id: number): void;
}

const browserScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
};

export interface RunnerOptions {
  readonly bodies: readonly Body[];
  readonly physics: PhysicsConfig;
  /** Tiempo simulado por cada segundo real, a velocidad ×1. */
  readonly timeScale: number;
  /** Si se indica, al llegar a este tiempo la simulación vuelve al inicio. */
  readonly loopAt?: number;
  /** Se llama con cada estado nuevo: es lo que se dibuja. */
  readonly onFrame: (state: SimState) => void;
  /** Se llama si dos cuerpos se tocan; el runner ya se ha pausado. */
  readonly onContact?: (contact: Contact) => void;
  /** Se llama cada vez que la simulación arranca o se para, por la causa que sea. */
  readonly onRunningChange?: (running: boolean) => void;
  readonly scheduler?: FrameScheduler;
}

/**
 * Tiempo real máximo que se recupera de golpe. Si la pestaña estuvo oculta
 * varios segundos, no intentamos calcular todo ese tiempo de una vez:
 * congelaría la página. Simplemente seguimos desde donde estábamos.
 */
const MAX_FRAME_SECONDS = 0.1;

/**
 * Mueve una simulación en tiempo real. Vive fuera de React: el canvas y la
 * gráfica leen de él directamente, sin re-renderizar la interfaz en cada
 * fotograma (bloque 3 de la especificación).
 */
export class SimulationRunner {
  private simulation: Simulation;
  private readonly scheduler: FrameScheduler;
  private frameId: number | null = null;
  private lastTimestamp: number | null = null;
  /** Tiempo simulado pendiente que aún no llega a un paso completo. */
  private pendingTime = 0;
  private speed = 1;

  constructor(private readonly options: RunnerOptions) {
    this.scheduler = options.scheduler ?? browserScheduler;
    this.simulation = createSimulation(options.bodies, options.physics);
  }

  get isRunning(): boolean {
    return this.frameId !== null;
  }

  get state(): SimState {
    return snapshot(this.simulation);
  }

  play(): void {
    if (this.isRunning) return;
    this.lastTimestamp = null;
    this.frameId = this.scheduler.request(this.tick);
    this.options.onRunningChange?.(true);
  }

  pause(): void {
    if (this.frameId === null) return;
    this.scheduler.cancel(this.frameId);
    this.frameId = null;
    this.options.onRunningChange?.(false);
  }

  /** Vuelve a las condiciones iniciales, sin cambiar si estaba en marcha. */
  reset(): void {
    this.simulation = createSimulation(this.options.bodies, this.options.physics);
    this.pendingTime = 0;
    this.options.onFrame(this.state);
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  private tick = (timestamp: number): void => {
    const elapsed =
      this.lastTimestamp === null
        ? 0
        : Math.min((timestamp - this.lastTimestamp) / 1000, MAX_FRAME_SECONDS);
    this.lastTimestamp = timestamp;

    // Tiempo real → tiempo simulado → número de pasos fijos del motor.
    const { dt } = this.options.physics;
    this.pendingTime += elapsed * this.options.timeScale * this.speed;
    let steps = Math.floor(this.pendingTime / dt);
    this.pendingTime -= steps * dt;

    // Si este fotograma cruza el final del periodo, avanzamos justo hasta él.
    const { loopAt } = this.options;
    const stepsToLoop =
      loopAt === undefined ? Infinity : Math.round((loopAt - this.simulation.time) / dt);
    const loops = steps >= stepsToLoop;
    if (loops) steps = stepsToLoop;

    const result = advance(this.simulation, steps);
    this.simulation = loops
      ? createSimulation(this.options.bodies, this.options.physics)
      : result.simulation;

    this.options.onFrame(this.state);

    if (result.contact) {
      this.pause();
      this.options.onContact?.(result.contact);
      return;
    }

    this.frameId = this.scheduler.request(this.tick);
  };
}
