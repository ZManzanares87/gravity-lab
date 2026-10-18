import { EARTH_MASS, EARTH_RADIUS, G_SI } from "@/physics/constants";
import type { Body, PhysicsConfig } from "@/physics/types";
import { vec, ZERO } from "@/physics/vec2";

/**
 * Las cuatro escenas del laboratorio. Los parámetros se guardan en las
 * unidades que ve el usuario (m, km, km/s, kg): así los controles, las
 * explicaciones y el tutor IA hablan el mismo idioma. Cada escena los
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
  /** "log" para rangos enormes, como la altura de 10 m a la distancia de la Luna. */
  readonly scale: "linear" | "log";
  /** Valores destacados en el deslizador, por ejemplo la Estación Espacial. */
  readonly marks?: readonly { readonly value: number; readonly label: string }[];
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
  readonly title: string;
  readonly defaults: P;
  readonly params: readonly ParamSpec<P>[];
  /** Ausente en Altura, que es un medidor sin animación. */
  readonly run?: SceneRun;
  buildBodies(params: P): Body[];
  view(params: P): View;
}

/** Ayuda a TypeScript a deducir el tipo de los parámetros de cada escena. */
function defineScene<P extends Params>(scene: SceneDefinition<P>): SceneDefinition<P> {
  return scene;
}

const R = EARTH_RADIUS;

const earth: Body = {
  id: "tierra",
  name: "Tierra",
  mass: EARTH_MASS,
  radius: R,
  position: ZERO,
  velocity: ZERO,
};

// ── 1. Superficie ──────────────────────────────────────────────────────
const BOWLING_RADIUS = 0.11;
const TENNIS_RADIUS = 0.033;

const superficie = defineScene({
  title: "Superficie",
  defaults: { height: 10, bowlingMass: 7, tennisMass: 0.058 },
  params: [
    { key: "height", label: "Altura", unit: "m", min: 1, max: 100, scale: "linear" },
    { key: "bowlingMass", label: "Masa de la bola", unit: "kg", min: 0.01, max: 1000, scale: "log" },
    { key: "tennisMass", label: "Masa de la pelota", unit: "kg", min: 0.01, max: 1000, scale: "log" },
  ],
  run: {
    physics: { G: G_SI, dt: 1e-3 },
    timeScale: 1,
    clock: { unit: "s", secondsPerUnit: 1 },
  },
  // La altura se mide desde la parte de abajo de cada bola: las dos
  // tienen que recorrer exactamente la misma distancia.
  buildBodies: ({ height, bowlingMass, tennisMass }) => [
    earth,
    {
      id: "bola",
      name: "Bola de bolos",
      mass: bowlingMass,
      radius: BOWLING_RADIUS,
      position: vec(-1, R + height + BOWLING_RADIUS),
      velocity: ZERO,
    },
    {
      id: "pelota",
      name: "Pelota de tenis",
      mass: tennisMass,
      radius: TENNIS_RADIUS,
      position: vec(1, R + height + TENNIS_RADIUS),
      velocity: ZERO,
    },
  ],
  view: ({ height }) => {
    const span = height + 2;
    return { minX: -2, maxX: 2, minY: R - 0.15 * span, maxY: R + height + 0.35 * span };
  },
});

// ── 2. Altura (medidor, sin animación) ─────────────────────────────────
export const MOON_DISTANCE_KM = 384_400;

const altura = defineScene({
  title: "Altura",
  defaults: { altitude: 0.01 },
  params: [
    {
      key: "altitude",
      label: "Altura sobre el suelo",
      unit: "km",
      min: 0.01,
      max: MOON_DISTANCE_KM,
      scale: "log",
      marks: [
        { value: 400, label: "Estación Espacial" },
        { value: 6_371, label: "Doble de distancia al centro" },
        { value: 20_200, label: "Satélites GPS" },
        { value: MOON_DISTANCE_KM, label: "Luna" },
      ],
    },
  ],
  buildBodies: ({ altitude }) => [
    earth,
    {
      id: "objeto",
      name: "Objeto de 1 kg",
      mass: 1,
      radius: 0,
      position: vec(0, R + altitude * 1000),
      velocity: ZERO,
    },
  ],
  // Se ven la Tierra y el objeto: al alejarlo, la Tierra se hace pequeña.
  view: ({ altitude }) => {
    const top = Math.max(1.15 * R, 1.1 * (R + altitude * 1000));
    const half = Math.max(1.15 * R, top / 2);
    return { minX: -half, maxX: half, minY: -1.15 * R, maxY: top };
  },
});

// ── 3. Lanzamiento (el cañón de Newton) ────────────────────────────────
export const LAUNCH_ALTITUDE_KM = 500;

const lanzamiento = defineScene({
  title: "Lanzamiento",
  defaults: { speed: 3 },
  params: [{ key: "speed", label: "Velocidad horizontal", unit: "km/s", min: 0, max: 12, scale: "linear" }],
  run: {
    physics: { G: G_SI, dt: 1 },
    timeScale: 600,
    clock: { unit: "min", secondsPerUnit: 60 },
  },
  buildBodies: ({ speed }) => [
    earth,
    {
      id: "proyectil",
      name: "Proyectil",
      mass: 100,
      radius: 1,
      position: vec(0, R + LAUNCH_ALTITUDE_KM * 1000),
      velocity: vec(speed * 1000, 0),
    },
  ],
  view: () => ({ minX: -2.2 * R, maxX: 2.2 * R, minY: -2.2 * R, maxY: 2.2 * R }),
});

// ── 4. Tercer cuerpo (unidades abstractas, como la galería) ────────────
const STAR_RADIUS = 0.05;
/** Velocidad de una órbita circular de dos estrellas iguales separadas 1: √(G·m / 2d). */
const BINARY_SPEED = Math.sqrt(0.5);

const tercerCuerpo = defineScene({
  title: "Tercer cuerpo",
  defaults: { thirdMass: 0 },
  params: [
    { key: "thirdMass", label: "Masa de la tercera estrella", unit: "", min: 0, max: 1, scale: "linear" },
  ],
  run: {
    physics: { G: 1, dt: 1e-3 },
    timeScale: 1,
    clock: { unit: "", secondsPerUnit: 1 },
  },
  buildBodies: ({ thirdMass }) => {
    const binary: Body[] = [
      { id: "a", name: "Estrella A", mass: 1, radius: STAR_RADIUS, position: vec(-0.5, 0), velocity: vec(0, -BINARY_SPEED) },
      { id: "b", name: "Estrella B", mass: 1, radius: STAR_RADIUS, position: vec(0.5, 0), velocity: vec(0, BINARY_SPEED) },
    ];
    // Con masa 0 la tercera estrella no existe: ni siquiera como cuerpo de prueba.
    if (thirdMass <= 0) return binary;
    return [
      ...binary,
      { id: "c", name: "Estrella C", mass: thirdMass, radius: STAR_RADIUS, position: vec(0, 1.5), velocity: vec(-0.4, 0) },
    ];
  },
  view: () => ({ minX: -2, maxX: 2, minY: -2, maxY: 2 }),
});

export const SCENES = {
  superficie,
  altura,
  lanzamiento,
  "tercer-cuerpo": tercerCuerpo,
};

export type SceneId = keyof typeof SCENES;

/** Orden sugerido de los experimentos (ver especificación 2.10). */
export const SCENE_ORDER: readonly SceneId[] = ["superficie", "altura", "lanzamiento", "tercer-cuerpo"];

/** Mantiene un valor dentro del rango de su control. */
export function clampParam<P extends Params>(spec: ParamSpec<P>, value: number): number {
  return Math.min(spec.max, Math.max(spec.min, value));
}
