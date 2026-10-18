import { EARTH_MASS, EARTH_RADIUS, G_SI } from "@/physics/constants";
import type { Body, PhysicsConfig } from "@/physics/types";
import { vec, ZERO } from "@/physics/vec2";

/**
 * Las cuatro escenas del laboratorio. Los parámetros se guardan en las
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
  /** Constante G de la escena: la real o 1 en unidades abstractas. */
  readonly G: number;
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
const DEGREES = Math.PI / 180;

export const EARTH: Body = {
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
      position: vec(-1, R + height + BOWLING_RADIUS),
      velocity: vec(0, upSpeed),
    },
    {
      id: "pelota",
      name: "Pelota de tenis",
      mass: tennisMass,
      radius: TENNIS_RADIUS,
      position: vec(1, R + height + TENNIS_RADIUS),
      velocity: vec(0, upSpeed),
    },
  ],
  view: ({ height, upSpeed }) => {
    // Altura máxima de la subida: v² / 2g, con g ≈ 9,8 m/s².
    const top = height + (upSpeed * upSpeed) / (2 * 9.8);
    const span = top + 2;
    return { minX: -2, maxX: 2, minY: R - 0.15 * span, maxY: R + top + 0.35 * span };
  },
});

// ── 2. Altura (medidor, sin animación) ─────────────────────────────────
export const MOON_DISTANCE_KM = 384_400;

const altura = defineScene({
  title: "Altura",
  defaults: { altitude: 0.01, objectMass: 1 },
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
    { key: "objectMass", label: "Masa del objeto", unit: "kg", min: 0.01, max: 1000, scale: "log" },
  ],
  G: G_SI,
  buildBodies: ({ altitude, objectMass }) => [
    EARTH,
    {
      id: "objeto",
      name: "Objeto",
      mass: objectMass,
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
const lanzamiento = defineScene({
  title: "Lanzamiento",
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
  view: () => ({ minX: -1.7 * R, maxX: 1.7 * R, minY: -1.7 * R, maxY: 1.7 * R }),
});

// ── 4. Tercer cuerpo (unidades abstractas, como la galería) ────────────
const STAR_RADIUS = 0.05;

const tercerCuerpo = defineScene({
  title: "Tercer cuerpo",
  defaults: { thirdMass: 0, thirdDistance: 1.5, thirdSpeed: 0.4, starMass: 1 },
  params: [
    { key: "thirdMass", label: "Masa de la tercera estrella", unit: "", min: 0, max: 1, scale: "linear" },
    { key: "thirdDistance", label: "Distancia de la tercera estrella", unit: "", min: 1, max: 3, scale: "linear" },
    { key: "thirdSpeed", label: "Velocidad de la tercera estrella", unit: "", min: 0, max: 1, scale: "linear" },
    { key: "starMass", label: "Masa de las estrellas A y B", unit: "", min: 0.2, max: 2, scale: "linear" },
  ],
  G: 1,
  run: {
    physics: { G: 1, dt: 1e-3 },
    timeScale: 1,
    clock: { unit: "", secondsPerUnit: 1 },
  },
  buildBodies: ({ thirdMass, thirdDistance, thirdSpeed, starMass }) => {
    // Órbita circular de dos estrellas iguales separadas 1: v = √(G·m / 2d).
    const binarySpeed = Math.sqrt(starMass / 2);
    const binary: Body[] = [
      { id: "a", name: "Estrella A", mass: starMass, radius: STAR_RADIUS, position: vec(-0.5, 0), velocity: vec(0, -binarySpeed) },
      { id: "b", name: "Estrella B", mass: starMass, radius: STAR_RADIUS, position: vec(0.5, 0), velocity: vec(0, binarySpeed) },
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
  altura,
  lanzamiento,
  "tercer-cuerpo": tercerCuerpo,
};

export type SceneId = keyof typeof SCENES;

/** Orden sugerido de los experimentos (ver especificación 2.10). */
export const SCENE_ORDER: readonly SceneId[] = ["superficie", "altura", "lanzamiento", "tercer-cuerpo"];

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
