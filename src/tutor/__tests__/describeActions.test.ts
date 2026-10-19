import { describe, expect, it } from "vitest";
import { describeActions } from "../describeActions";

describe("descripción de propuestas", () => {
  it("describe cada acción en palabras, con los parámetros de la escena que se abre", () => {
    const steps = describeActions(
      [
        { type: "loadScene", scene: "lanzamiento" },
        { type: "setParam", key: "speed", value: 7.6 },
        { type: "play" },
      ],
      "superficie",
    );
    expect(steps).toEqual(["Abrir la escena Lanzamiento", "Velocidad: 7,6 km/s", "Reproducir"]);
  });
});
