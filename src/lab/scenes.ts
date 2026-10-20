import { EARTH_MASS, EARTH_RADIUS, G_SI } from "@/physics/constants";
import type { Body, PhysicsConfig } from "@/physics/types";
import { vec, ZERO } from "@/physics/vec2";

/**
 * Las escenas del laboratorio. Los parámetros se guardan en las
 * unidades que ve el usuario (m, km, km/s, kg, grados): así los controles,
 * las explicaciones y el tutor IA hablan el mismo idioma. Cada escena los
 * convierte a unidades del Sistema Internacional al construir los cuerpos.
 */

export type Params = Record<string, number>;

/** Descripción de un control: la usan los deslizadores y el tutor IA. */
export interface ParamSpec<P extends Params> {
  readonly key: keyof P & string;
  readonly label: string;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  /** "log" para rangos enormes, como las masas, de 10 g a 1000 kg. */
  readonly scale: "linear" | "log";
  /** Extremos en palabras ("Cerca", "Lejos"). Si los hay, no se muestra el número: es para escenas en unidades abstractas. */
  readonly ends?: readonly [string, string];
}

/** El rectángulo del mundo que debe verse en pantalla. */
export interface View {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export interface SceneRun {
  readonly physics: PhysicsConfig;
  /** Tiempo simulado por cada segundo real, a velocidad ×1. */
  readonly timeScale: number;
  /** Unidad del reloj en pantalla y cuántos segundos simulados vale. */
  readonly clock: { readonly unit: string; readonly secondsPerUnit: number };
}

export interface SceneDefinition<P extends Params> {
  readonly defaults: P;
  readonly params: readonly ParamSpec<P>[];
  /** Constante G de la escena: la real o 1 en unidades abstractas. */
  readonly G: number;
  readonly run: SceneRun;
  buildBodies(params: P): Body[];
  view(params: P): View;
}

/** Ayuda a TypeScript a deducir el tipo de los parámetros de cada escena. */
function defineScene<P extends Params>(scene: SceneDefinition<P>): SceneDefinition<P> {
  return scene;
}

const R = EARTH_RADIUS;
const DEGREES = Math.PI / 180;

export const EARTH: Body = {
  id: "tierra",
  name: "Tierra",
  mass: EARTH_MASS,
  radius: R,
  position: ZERO,
  velocity: ZERO,
};

// ── Superficie ──────────────────────────────────────────────────────
const BOWLING_RADIUS = 0.11;
const TENNIS_RADIUS = 0.033;

/**
 * Distancia horizontal de cada bola al centro. Crece con la altura: si fuera
 * fija, a 100 m la escala sería tan pequeña que las dos bolas se pisarían.
 */
function ballOffset(height: number): number {
  return 0.5 + 0.1 * height;
}

const superficie = defineScene({
  defaults: { height: 10, bowlingMass: 7, tennisMass: 0.058, upSpeed: 0 },
  params: [
    { key: "height", label: "Altura", unit: "m", min: 1, max: 100, scale: "linear" },
    { key: "bowlingMass", label: "Masa de la bola", unit: "kg", min: 0.01, max: 1000, scale: "log" },
    { key: "tennisMass", label: "Masa de la pelota", unit: "kg", min: 0.01, max: 1000, scale: "log" },
    { key: "upSpeed", label: "Velocidad inicial hacia arriba", unit: "m/s", min: 0, max: 30, scale: "linear" },
  ],
  G: G_SI,
  run: {
    physics: { G: G_SI, dt: 1e-3 },
    timeScale: 1,
    clock: { unit: "s", secondsPerUnit: 1 },
  },
  // La altura se mide desde la parte de abajo de cada bola: las dos
  // tienen que recorrer exactamente la misma distancia.
  buildBodies: ({ height, bowlingMass, tennisMass, upSpeed }) => [
    EARTH,
    {
      id: "bola",
      name: "Bola de bolos",
      mass: bowlingMass,
      radius: BOWLING_RADIUS,
      position: vec(-ballOffset(height), R + height + BOWLING_RADIUS),
      velocity: vec(0, upSpeed),
    },
    {
      id: "pelota",
      name: "Pelota de tenis",
      mass: tennisMass,
      radius: TENNIS_RADIUS,
      position: vec(ballOffset(height), R + height + TENNIS_RADIUS),
      velocity: vec(0, upSpeed),
    },
  ],
  view: ({ height, upSpeed }) => {
    // Altura máxima de la subida: v² / 2g, con g ≈ 9,8 m/s².
    const top = height + (upSpeed * upSpeed) / (2 * 9.8);
    const span = top + 2;
    const half = ballOffset(height) + 1;
    return { minX: -half, maxX: half, minY: R - 0.15 * span, maxY: R + top + 0.35 * span };
  },
});

// ── Lanzamiento (el cañón de Newton) ────────────────────────────────

/**
 * Medio lado de la vista: lo justo para que quepa la órbita entera.
 * Con la energía y el momento angular del lanzamiento se calcula el punto
 * más alejado de la elipse (el apogeo), sin tener que simular nada.
 */
export function launchExtent({ speed, angle, launchAltitude }: Params): number {
  const mu = G_SI * EARTH_MASS;
  const r0 = R + (launchAltitude ?? 0) * 1000;
  const v = (speed ?? 0) * 1000;
  const energy = (v * v) / 2 - mu / r0;
  // Energía positiva: el proyectil escapa. Se ve cómo se aleja.
  if (energy >= 0) return 4 * R;
  const semiMajorAxis = -mu / (2 * energy);
  const angularMomentum = r0 * v * Math.cos((angle ?? 0) * DEGREES);
  const eccentricity = Math.sqrt(Math.max(0, 1 + (2 * energy * angularMomentum ** 2) / mu ** 2));
  const apoapsis = semiMajorAxis * (1 + eccentricity);
  return Math.min(6 * R, Math.max(1.3 * R, 1.1 * apoapsis));
}

const lanzamiento = defineScene({
  defaults: { speed: 3, angle: 0, launchAltitude: 500 },
  params: [
    { key: "speed", label: "Velocidad", unit: "km/s", min: 0, max: 12, scale: "linear" },
    { key: "angle", label: "Ángulo sobre la horizontal", unit: "°", min: -30, max: 60, scale: "linear" },
    { key: "launchAltitude", label: "Altura de lanzamiento", unit: "km", min: 10, max: 2000, scale: "linear" },
  ],
  G: G_SI,
  run: {
    physics: { G: G_SI, dt: 1 },
    timeScale: 600,
    clock: { unit: "min", secondsPerUnit: 60 },
  },
  buildBodies: ({ speed, angle, launchAltitude }) => [
    EARTH,
    {
      id: "proyectil",
      name: "Proyectil",
      mass: 100,
      radius: 1,
      position: vec(0, R + launchAltitude * 1000),
      velocity: vec(speed * 1000 * Math.cos(angle * DEGREES), speed * 1000 * Math.sin(angle * DEGREES)),
    },
  ],
  view: (params) => {
    const extent = launchExtent(params);
    return { minX: -extent, maxX: extent, minY: -extent, maxY: extent };
  },
});

// ── Tercer cuerpo (unidades abstractas, como la galería) ────────────
const STAR_RADIUS = 0.05;
/** A y B pesan siempre lo mismo: lo que importa es cuánto pesa la tercera comparada con ellas. */
const STAR_MASS = 1;

const tercerCuerpo = defineScene({
  defaults: { thirdMass: 0, thirdDistance: 1.5, thirdSpeed: 0.4 },
  params: [
    { key: "thirdMass", label: "Masa de la tercera estrella", unit: "", min: 0, max: 1, scale: "linear", ends: ["Ninguna", "Como A y B"] },
    { key: "thirdDistance", label: "Distancia de la tercera estrella", unit: "", min: 1, max: 3, scale: "linear", ends: ["Cerca", "Lejos"] },
    { key: "thirdSpeed", label: "Velocidad de la tercera estrella", unit: "", min: 0, max: 1, scale: "linear", ends: ["Quieta", "Rápida"] },
  ],
  G: 1,
  run: {
    physics: { G: 1, dt: 1e-3 },
    timeScale: 1,
    clock: { unit: "", secondsPerUnit: 1 },
  },
  buildBodies: ({ thirdMass, thirdDistance, thirdSpeed }) => {
    // Órbita circular de dos estrellas iguales separadas 1: v = √(G·m / 2d).
    const binarySpeed = Math.sqrt(STAR_MASS / 2);
    const binary: Body[] = [
      { id: "a", name: "Estrella A", mass: STAR_MASS, radius: STAR_RADIUS, position: vec(-0.5, 0), velocity: vec(0, -binarySpeed) },
      { id: "b", name: "Estrella B", mass: STAR_MASS, radius: STAR_RADIUS, position: vec(0.5, 0), velocity: vec(0, binarySpeed) },
    ];
    // Con masa 0 la tercera estrella no existe: ni siquiera como cuerpo de prueba.
    if (thirdMass <= 0) return binary;
    return [
      ...binary,
      { id: "c", name: "Estrella C", mass: thirdMass, radius: STAR_RADIUS, position: vec(0, thirdDistance), velocity: vec(-thirdSpeed, 0) },
    ];
  },
  view: () => ({ minX: -2.5, maxX: 2.5, minY: -2.5, maxY: 2.5 }),
});

export const SCENES = {
  superficie,
  lanzamiento,
  "tercer-cuerpo": tercerCuerpo,
};

export type SceneId = keyof typeof SCENES;

/** Orden de los experimentos: el laboratorio, la bienvenida y el tutor leen de aquí. */
export const SCENE_ORDER = ["superficie", "lanzamiento", "tercer-cuerpo"] as const satisfies readonly SceneId[];

/** Mantiene un valor dentro del rango de su control. */
export function clampParam(spec: { readonly min: number; readonly max: number }, value: number): number {
  return Math.min(spec.max, Math.max(spec.min, value));
}

/**
 * Una escena vista de forma genérica, con parámetros Record<string, number>.
 * Los parámetros siempre vienen del store, que parte de los valores por
 * defecto de la escena y valida cada cambio: su forma es la correcta.
 */
export function getScene(id: SceneId): SceneDefinition<Params> {
  // TypeScript no puede comprobarlo por sí solo (keyof hace incompatibles los tipos
  // genéricos); la forma de los parámetros la garantiza el store.
  return SCENES[id] as unknown as SceneDefinition<Params>;
}
