import type { Vec2 } from "./types";

/**
 * Operaciones con vectores 2D. Todas devuelven un vector nuevo:
 * nunca modifican los que reciben.
 */

export const ZERO: Vec2 = { x: 0, y: 0 };

export function vec(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, factor: number): Vec2 {
  return { x: v.x * factor, y: v.y * factor };
}

/** Longitud al cuadrado. Evita la raíz cuadrada cuando solo hay que comparar. */
export function lengthSquared(v: Vec2): number {
  return v.x * v.x + v.y * v.y;
}

export function length(v: Vec2): number {
  return Math.sqrt(lengthSquared(v));
}
