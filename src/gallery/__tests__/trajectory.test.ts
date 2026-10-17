import { describe, expect, it } from "vitest";
import { length, sub } from "@/physics/vec2";
import { findSolution } from "../solutions";
import { sampleTrajectory, trajectoryBounds } from "../trajectory";

describe("trayectorias", () => {
  const figureEight = findSolution("figura-de-ocho")!;
  const trajectory = sampleTrajectory(figureEight, 100);

  it("guarda un recorrido por cuerpo, con el punto inicial más las muestras", () => {
    expect(trajectory).toHaveLength(3);
    trajectory.forEach((path) => expect(path).toHaveLength(101));
  });

  it("el recorrido se cierra: el último punto vuelve al primero", () => {
    trajectory.forEach((path) => {
      const first = path[0]!;
      const last = path[path.length - 1]!;
      expect(length(sub(last, first))).toBeLessThan(1e-2);
    });
  });

  it("calcula el rectángulo que contiene la figura de ocho", () => {
    const bounds = trajectoryBounds(trajectory);
    // La figura de ocho mide algo más de 2 unidades de ancho, centrada en el origen.
    expect(bounds.minX).toBeLessThan(-1);
    expect(bounds.maxX).toBeGreaterThan(1);
    expect(bounds.minX + bounds.maxX).toBeCloseTo(0, 2);
  });
});
