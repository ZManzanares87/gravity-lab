"use client";

import { useEffect, useRef, useState } from "react";
import type { SimState, Vec2 } from "@/physics/types";
import { SimulationRunner } from "@/simulation/runner";
import { GALLERY_PHYSICS, type ThreeBodySolution } from "../solutions";
import { trajectoryBounds, type Trajectory } from "../trajectory";

const BODY_COLOR_VARS = ["--color-body-a", "--color-body-b", "--color-body-c"] as const;
const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;
/**
 * La estela cubre siempre el mismo trozo de órbita (15 % del periodo),
 * a cualquier velocidad. Medirla en fotogramas la haría diminuta a ×0,25
 * y casi una vuelta entera a ×4.
 */
const TRAIL_FRACTION = 0.15;
const BODY_RADIUS_PX = 6;
const CANVAS_PADDING_PX = 24;

interface TrailPoint {
  readonly position: Vec2;
  /** Tiempo acumulado de la animación, que sigue creciendo entre vueltas. */
  readonly time: number;
}

interface OrbitPlayerProps {
  readonly solution: ThreeBodySolution;
  /** La órbita completa, calculada en el servidor: se dibuja tenue de fondo. */
  readonly trajectory: Trajectory;
}

function formatTime(value: number): string {
  return value.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function OrbitPlayer({ solution, trajectory }: OrbitPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clockRef = useRef<HTMLOutputElement>(null);
  const runnerRef = useRef<SimulationRunner | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    // Los colores salen de las variables CSS: una sola fuente de verdad.
    const styles = getComputedStyle(document.documentElement);
    const colors = BODY_COLOR_VARS.map((name) => styles.getPropertyValue(name).trim());
    const ink = styles.getPropertyValue("--color-ink").trim();
    const paper = styles.getPropertyValue("--color-paper").trim();
    const fontFamily = getComputedStyle(canvas).fontFamily;

    const bounds = trajectoryBounds(trajectory);
    const trailDuration = TRAIL_FRACTION * solution.period;
    const trails: TrailPoint[][] = solution.bodies.map(() => []);
    let completedLoops = 0;
    let previousTime = 0;
    let lastClockUpdate = 0;

    /**
     * Añade la posición actual a las estelas y descarta los puntos más
     * antiguos que la duración de la estela. Al completar una vuelta, el
     * reloj de la simulación vuelve a 0, pero la estela continúa: el final
     * de la vuelta coincide con el inicio (test de cierre de la galería).
     */
    const record = (state: SimState) => {
      if (state.time < previousTime) completedLoops += 1;
      previousTime = state.time;
      const now = completedLoops * solution.period + state.time;

      state.bodies.forEach((body, i) => {
        const trail = trails[i];
        if (!trail) return;
        trail.push({ position: body.position, time: now });
        while (trail.length > 0 && now - (trail[0]?.time ?? now) > trailDuration) trail.shift();
      });
    };

    const render = (state: SimState) => {
      // Tamaño real en píxeles de pantalla: nítido en pantallas de alta densidad.
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      // Coordenadas de la simulación → píxeles, centrando la órbita (y hacia arriba).
      const scale = Math.min(
        (width - 2 * CANVAS_PADDING_PX) / (bounds.maxX - bounds.minX),
        (height - 2 * CANVAS_PADDING_PX) / (bounds.maxY - bounds.minY),
      );
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      const toScreen = (p: Vec2) => ({
        x: width / 2 + (p.x - centerX) * scale,
        y: height / 2 - (p.y - centerY) * scale,
      });
      const strokeLine = (points: readonly Vec2[]) => {
        context.beginPath();
        points.forEach((point, j) => {
          const { x, y } = toScreen(point);
          if (j === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();
      };

      // 1. La órbita completa, tenue.
      context.globalAlpha = 0.25;
      context.lineWidth = 1;
      trajectory.forEach((points, i) => {
        context.strokeStyle = colors[i] ?? ink;
        strokeLine(points);
      });

      // 2. Las estelas.
      context.globalAlpha = 1;
      context.lineWidth = 2.5;
      trails.forEach((trail, i) => {
        context.strokeStyle = colors[i] ?? ink;
        strokeLine(trail.map((point) => point.position));
      });

      // 3. Los cuerpos, con su letra al lado (no solo color).
      context.font = `700 14px ${fontFamily}`;
      state.bodies.forEach((body, i) => {
        const { x, y } = toScreen(body.position);
        context.beginPath();
        context.arc(x, y, BODY_RADIUS_PX, 0, 2 * Math.PI);
        context.fillStyle = colors[i] ?? ink;
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = paper;
        context.stroke();
        context.fillStyle = ink;
        context.fillText(body.id.toUpperCase(), x + 9, y - 9);
      });

      // El reloj en texto se actualiza 4 veces por segundo, no en cada fotograma.
      const now = performance.now();
      if (clockRef.current && now - lastClockUpdate > 250) {
        clockRef.current.textContent = `t = ${formatTime(state.time)} de ${formatTime(solution.period)}`;
        lastClockUpdate = now;
      }
    };

    const runner = new SimulationRunner({
      bodies: solution.bodies,
      physics: GALLERY_PHYSICS,
      timeScale: 1,
      loopAt: solution.period,
      onFrame: (state) => {
        record(state);
        render(state);
      },
      onRunningChange: setPlaying,
    });
    runnerRef.current = runner;

    // Reiniciar sí borra las estelas: es volver a empezar de verdad.
    resetRef.current = () => {
      trails.forEach((trail) => (trail.length = 0));
      completedLoops = 0;
      previousTime = 0;
      runner.reset();
    };

    record(runner.state);
    render(runner.state);

    // Si el sistema pide menos movimiento, la animación empieza en pausa.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) runner.play();

    // En pausa no hay fotogramas: si cambia el tamaño, redibujamos a mano.
    const observer = new ResizeObserver(() => render(runner.state));
    observer.observe(canvas);

    return () => {
      runner.pause();
      observer.disconnect();
      runnerRef.current = null;
      resetRef.current = null;
    };
  }, [solution, trajectory]);

  const togglePlay = () => {
    const runner = runnerRef.current;
    if (!runner) return;
    if (runner.isRunning) runner.pause();
    else runner.play();
  };

  const changeSpeed = (value: number) => {
    setSpeed(value);
    runnerRef.current?.setSpeed(value);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Animación de la órbita ${solution.name}: tres cuerpos, A, B y C, moviéndose sobre su trayectoria.`}
        className="block aspect-[4/3] w-full border border-ink/20 bg-paper"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="min-w-32 bg-ink px-4 py-2 font-bold text-paper hover:bg-ink/85"
        >
          {playing ? "Pausar" : "Reproducir"}
        </button>
        <button
          type="button"
          onClick={() => resetRef.current?.()}
          className="border border-ink px-4 py-2 font-bold hover:bg-ink/5"
        >
          Reiniciar
        </button>
        <label className="flex items-center gap-2">
          Velocidad
          <select
            value={speed}
            onChange={(event) => changeSpeed(Number(event.target.value))}
            className="border border-ink/40 bg-paper px-2 py-2"
          >
            {SPEEDS.map((value) => (
              <option key={value} value={value}>
                ×{value.toLocaleString("es-ES")}
              </option>
            ))}
          </select>
        </label>
        <output ref={clockRef} className="ml-auto tabular-nums text-ink-soft" />
      </div>
    </div>
  );
}
