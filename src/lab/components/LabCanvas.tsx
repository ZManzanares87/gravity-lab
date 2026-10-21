"use client";

import { useEffect, useRef } from "react";
import type { Body, SimState, Vec2 } from "@/physics/types";
import { SimulationRunner } from "@/simulation/runner";
import { formatNumber } from "../format";
import { EXPERIMENT_TITLES } from "../journey";
import { setLiveState } from "../liveState";
import { drawMeasureLines } from "../measureLines";
import { getScene } from "../scenes";
import { useLabStore } from "../store";
import { ContactMessage } from "./ContactMessage";
import { PlaybackControls } from "./PlaybackControls";

const MOVING_COLOR_VARS = ["--color-body-a", "--color-body-b", "--color-body-c"] as const;
const MAX_TRAIL_POINTS = 4000;
const CANVAS_PADDING_PX = 16;
/** Por debajo de este radio en pantalla, un cuerpo se dibuja como marcador. */
const MIN_VISIBLE_RADIUS_PX = 3;
const MARKER_RADIUS_PX = 6;
/**
 * Por encima de este radio en pantalla, el cuerpo se dibuja como un suelo
 * plano. En Superficie, la Tierra mide cientos de millones de píxeles:
 * el canvas no puede dibujar un círculo así con precisión.
 */
const FLAT_GROUND_RADIUS_PX = 50_000;
const FAR = 10_000;

export function LabCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clockRef = useRef<HTMLOutputElement>(null);
  const distanceRef = useRef<HTMLSpanElement>(null);
  const legendRef = useRef<HTMLParagraphElement>(null);
  const runnerRef = useRef<SimulationRunner | null>(null);
  const sceneId = useLabStore((state) => state.sceneId);
  const runId = useLabStore((state) => state.runId);
  const playing = useLabStore((state) => state.playing);
  const speed = useLabStore((state) => state.speed);

  // Cada escena o cada runId nuevo construye la simulación desde cero.
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const lab = useLabStore.getState();
    const scene = getScene(sceneId);
    const bodies = scene.buildBodies(lab.params);
    const view = scene.view(lab.params);

    // Colores desde las variables CSS: la Tierra en tinta, el resto por orden.
    const styles = getComputedStyle(document.documentElement);
    const cssColor = (name: string) => styles.getPropertyValue(name).trim();
    const ink = cssColor("--color-ink");
    const movingColors = MOVING_COLOR_VARS.map(cssColor);
    const fontFamily = getComputedStyle(canvas).fontFamily;
    const colorOf = new Map<string, string>();
    bodies
      .filter((body) => body.id !== "tierra")
      .forEach((body, i) => colorOf.set(body.id, movingColors[i % movingColors.length] ?? ink));

    const trails = new Map<string, Vec2[]>(bodies.map((body) => [body.id, []]));
    let lastClockUpdate = 0;

    const record = (state: SimState) => {
      setLiveState(state);
      state.bodies.forEach((body) => {
        if (body.id === "tierra") return;
        const trail = trails.get(body.id);
        if (!trail) return;
        trail.push(body.position);
        if (trail.length > MAX_TRAIL_POINTS) trail.shift();
      });
    };

    const render = (state: SimState) => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      // Mundo → pantalla: la vista de la escena, centrada y sin deformar (y hacia arriba).
      const scale = Math.min(
        (width - 2 * CANVAS_PADDING_PX) / (view.maxX - view.minX),
        (height - 2 * CANVAS_PADDING_PX) / (view.maxY - view.minY),
      );
      const centerX = (view.minX + view.maxX) / 2;
      const centerY = (view.minY + view.maxY) / 2;
      const toScreen = (p: Vec2) => ({
        x: width / 2 + (p.x - centerX) * scale,
        y: height / 2 - (p.y - centerY) * scale,
      });

      /** Etiqueta a la derecha de los cuerpos de la derecha y a la izquierda de los de la izquierda. */
      type LabelBox = { x: number; y: number; w: number; h: number };
      // Etiquetas ya dibujadas en este fotograma: así un nombre nunca pisa a otro.
      const placed: LabelBox[] = [];
      const drawLabel = (text: string, x: number, y: number, gap: number) => {
        const w = context.measureText(text).width;
        const preferRight = x >= width / 2;
        // Por orden: arriba en el lado con más espacio, arriba en el otro, abajo en uno y otro.
        const candidates = [
          [preferRight, false],
          [!preferRight, false],
          [preferRight, true],
          [!preferRight, true],
        ] as const;
        const boxes = candidates.map(([right, below]) => {
          const baseline = below ? y + gap + 12 : y - gap;
          return { x: right ? x + gap : x - gap - w, y: baseline - 12, w, h: 16, baseline };
        });
        const overlaps = (a: LabelBox, b: LabelBox) =>
          a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        const chosen = boxes.find((box) => placed.every((other) => !overlaps(box, other))) ?? boxes[0];
        if (!chosen) return;
        placed.push(chosen);
        context.textAlign = "left";
        context.fillStyle = ink;
        context.fillText(text, chosen.x, chosen.baseline);
      };

      /** Dibuja un cuerpo enorme como un semiplano: su superficie vista de cerca. */
      const drawGround = (body: Body) => {
        const dx = centerX - body.position.x;
        const dy = centerY - body.position.y;
        const distance = Math.hypot(dx, dy) || 1;
        const surface = toScreen({
          x: body.position.x + (dx / distance) * body.radius,
          y: body.position.y + (dy / distance) * body.radius,
        });
        context.save();
        context.translate(surface.x, surface.y);
        // El eje x local apunta hacia fuera del cuerpo (en pantalla, la y está invertida).
        context.rotate(Math.atan2(-dy, dx));
        context.globalAlpha = 0.1;
        context.fillStyle = ink;
        context.fillRect(-FAR, -FAR, FAR, 2 * FAR);
        context.globalAlpha = 1;
        context.lineWidth = 2;
        context.strokeStyle = ink;
        context.beginPath();
        context.moveTo(0, -FAR);
        context.lineTo(0, FAR);
        context.stroke();
        context.restore();
        context.fillStyle = ink;
        context.fillText(`Suelo (${body.name})`, CANVAS_PADDING_PX, surface.y + 20);
      };

      // Si algún cuerpo se dibuja como marcador, se explica una sola vez en la leyenda.
      let anyMarker = false;

      const drawBody = (body: Body) => {
        const color = colorOf.get(body.id) ?? ink;
        const center = toScreen(body.position);
        const radius = body.radius * scale;

        if (radius > FLAT_GROUND_RADIUS_PX) {
          drawGround(body);
          return;
        }

        if (radius >= MIN_VISIBLE_RADIUS_PX) {
          context.beginPath();
          context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
          if (body.id === "tierra") {
            context.globalAlpha = 0.1;
            context.fillStyle = ink;
            context.fill();
            context.globalAlpha = 1;
            context.lineWidth = 1.5;
            context.strokeStyle = ink;
            context.stroke();
            context.fillStyle = ink;
            context.textAlign = "center";
            context.fillText(body.name, center.x, center.y + 5);
            context.textAlign = "left";
            return;
          }
          context.fillStyle = color;
          context.fill();
          drawLabel(body.name, center.x, center.y, radius + 6);
          return;
        }

        // Demasiado pequeño para verse a escala: marcador, sin agrandar el cuerpo.
        context.beginPath();
        context.arc(center.x, center.y, MARKER_RADIUS_PX, 0, 2 * Math.PI);
        context.lineWidth = 2.5;
        context.strokeStyle = color;
        context.stroke();
        anyMarker = true;
        drawLabel(body.name, center.x, center.y, 10);
      };

      // 1. Las estelas: el camino recorrido desde el inicio.
      context.lineWidth = 2;
      context.globalAlpha = 0.6;
      trails.forEach((points, id) => {
        context.strokeStyle = colorOf.get(id) ?? ink;
        context.beginPath();
        points.forEach((point, i) => {
          const { x, y } = toScreen(point);
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();
      });
      context.globalAlpha = 1;

      // Línea de cota: altura sobre el suelo o distancia al centro (la r de la fórmula).
      const centerDistance = drawMeasureLines(
        { context, toScreen, scale, width, ink, fontFamily, flatThresholdPx: FLAT_GROUND_RADIUS_PX },
        state.bodies,
      );

      // 2. Los cuerpos, con su nombre al lado.
      context.font = `700 14px ${fontFamily}`;
      state.bodies.forEach(drawBody);

      // La leyenda está fuera del canvas, así nunca choca con un cuerpo. Solo se toca si cambia.
      if (legendRef.current && legendRef.current.hidden === anyMarker) legendRef.current.hidden = !anyMarker;

      // 3. El reloj, 4 veces por segundo.
      const clock = scene.run.clock;
      const now = performance.now();
      if (clockRef.current && now - lastClockUpdate > 250) {
        const value = formatNumber(state.time / clock.secondsPerUnit, 3);
        clockRef.current.textContent = `Tiempo: ${value}${clock.unit ? ` ${clock.unit}` : ""}`;
        if (distanceRef.current) {
          distanceRef.current.textContent = centerDistance ? `Distancia desde el centro de la Tierra: ${centerDistance}` : "";
        }
        lastClockUpdate = now;
      }
    };

    const initial: SimState = { time: 0, bodies };
    record(initial);
    render(initial);

    const runner = new SimulationRunner({
      bodies,
      physics: scene.run.physics,
      timeScale: scene.run.timeScale,
      onFrame: (state) => {
        record(state);
        render(state);
        useLabStore.getState().reportTime(state.time);
      },
      onContacts: (contacts) => useLabStore.getState().reportContacts(contacts),
    });
    runner.setSpeed(lab.speed);
    runnerRef.current = runner;
    if (lab.playing) runner.play();

    const observer = new ResizeObserver(() => render(runner.state));
    observer.observe(canvas);

    return () => {
      runner.pause();
      observer.disconnect();
      runnerRef.current = null;
    };
  }, [sceneId, runId]);

  // Reproducir y pausar: el store decide, el runner obedece.
  useEffect(() => {
    const runner = runnerRef.current;
    if (!runner) return;
    if (playing) {
      runner.play();
      return;
    }
    runner.pause();
    // En pausa (también tras un contacto), el reloj muestra el tiempo exacto,
    // aunque el último fotograma cayera entre dos actualizaciones del texto.
    const clock = getScene(sceneId).run.clock;
    if (clockRef.current) {
      const value = formatNumber(runner.state.time / clock.secondsPerUnit, 3);
      clockRef.current.textContent = `Tiempo: ${value}${clock.unit ? ` ${clock.unit}` : ""}`;
    }
  }, [playing, sceneId]);

  useEffect(() => {
    runnerRef.current?.setSpeed(speed);
  }, [speed]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Simulación del experimento «${EXPERIMENT_TITLES[sceneId]}»`}
        className="block aspect-[4/3] w-full border border-ink/20 bg-paper lg:aspect-auto lg:h-[max(18rem,calc(100dvh-15rem))]"
      />
      {/* Datos de la simulación, como el pie de una figura: una línea en escritorio, en columna en móvil. */}
      <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
        <p ref={legendRef} hidden className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block size-3 shrink-0 rounded-full border-2 border-ink" />
          Objeto demasiado pequeño para verse a escala
        </p>
        <div className="flex flex-col gap-1 sm:ml-auto sm:flex-row sm:gap-x-6">
          <span ref={distanceRef} className="tabular-nums empty:hidden" />
          <output ref={clockRef} className="tabular-nums" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 empty:hidden">
        <PlaybackControls />
      </div>
      <ContactMessage />
    </div>
  );
}
