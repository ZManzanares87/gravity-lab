import { describe, expect, it } from "vitest";
import { SCENES } from "@/lab/scenes";
import { buildLabContext, type LabSnapshot } from "../context";

const lab: LabSnapshot = {
  sceneId: "lanzamiento",
  params: SCENES.lanzamiento.defaults,
  playing: false,
  finished: false,
  contacts: [],
  selectedOption: "orbita",
  phase: "predict",
  predictions: [{ scene: "superficie", option: "bola", correct: false }],
  discovered: ["masa"],
};

describe("contexto del tutor", () => {
  const context = buildLabContext(lab, {
    time: 0,
    bodies: SCENES.lanzamiento.buildBodies(SCENES.lanzamiento.defaults),
  });

  it("incluye la escena, las claves de los controles y sus rangos", () => {
    expect(context).toContain("Experimento actual: «¿Por qué la Luna no se cae?» (lanzamiento)");
    expect(context).toContain("- speed (\"Velocidad\")");
    expect(context).toContain("de 0 a 12 km/s");
    // Solo los del experimento actual: el tutor no debe abrir otros que aún no se han predicho.
    expect(context).not.toContain("superficie: height");
  });

  it("incluye las medidas del motor, la predicción y el historial", () => {
    expect(context).toContain("Proyectil: masa");
    expect(context).toContain("Predicción de la persona: \"Da vueltas a la Tierra sin caer\"");
    expect(context).toContain("superficie: no acertó");
  });

  it("es corto: viaja con cada mensaje y cuesta dinero", () => {
    expect(context.length).toBeLessThan(3000);
  });
});
