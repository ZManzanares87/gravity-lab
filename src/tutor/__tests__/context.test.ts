import { describe, expect, it } from "vitest";
import { SCENE_ORDER, SCENES } from "@/lab/scenes";
import { buildLabContext, type LabSnapshot } from "../context";
import { SCENE_IDS } from "../tools";

const lab: LabSnapshot = {
  sceneId: "lanzamiento",
  params: SCENES.lanzamiento.defaults,
  playing: false,
  finished: false,
  contacts: [],
  selectedOption: "orbita",
  revealed: false,
  predictions: [{ scene: "superficie", option: "bola", correct: false }],
  discovered: ["masa"],
};

describe("contexto del tutor", () => {
  const context = buildLabContext(lab, {
    time: 0,
    bodies: SCENES.lanzamiento.buildBodies(SCENES.lanzamiento.defaults),
  });

  it("incluye la escena, las claves de los controles y sus rangos", () => {
    expect(context).toContain("Escena actual: Lanzamiento");
    expect(context).toContain("- speed (\"Velocidad\")");
    expect(context).toContain("de 0 a 12 km/s");
  });

  it("incluye las medidas del motor, la predicción y el historial", () => {
    expect(context).toContain("Proyectil: masa");
    expect(context).toContain("Predicción de la persona: \"Da vueltas a la Tierra sin caer\"");
    expect(context).toContain("superficie: no acertó");
  });

  it("es corto: viaja con cada mensaje y cuesta dinero", () => {
    expect(context.length).toBeLessThan(3000);
  });

  it("la lista de escenas de la herramienta coincide con la del laboratorio", () => {
    expect([...SCENE_IDS]).toEqual([...SCENE_ORDER]);
  });
});
