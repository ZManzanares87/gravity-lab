import { describe, expect, it } from "vitest";
import { add, length, scale, sub, vec } from "../vec2";

describe("vec2", () => {
  it("suma y resta componente a componente", () => {
    expect(add(vec(1, 2), vec(3, 4))).toEqual(vec(4, 6));
    expect(sub(vec(1, 2), vec(3, 4))).toEqual(vec(-2, -2));
  });

  it("escala un vector", () => {
    expect(scale(vec(1, -2), 3)).toEqual(vec(3, -6));
  });

  it("calcula la longitud", () => {
    expect(length(vec(3, 4))).toBe(5);
  });

  it("no modifica los vectores de entrada", () => {
    const a = vec(1, 1);
    add(a, vec(2, 2));
    expect(a).toEqual(vec(1, 1));
  });
});
