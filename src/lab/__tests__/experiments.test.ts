import { describe, expect, it } from "vitest";
import { validateAction } from "../actions";
import { EXPERIMENTS } from "../experiments";
import { SCENE_ORDER } from "../scenes";

describe("experimentos", () => {
  it.each(SCENE_ORDER)("%s: la respuesta correcta es una de las opciones", (scene) => {
    const { answer, options } = EXPERIMENTS[scene];
    expect(options.map((option) => option.id)).toContain(answer);
  });

  it.each(SCENE_ORDER)("%s: las acciones de \"Comprobar\" son válidas en su escena", (scene) => {
    EXPERIMENTS[scene].check.forEach((action) => {
      expect(validateAction(action, scene).ok).toBe(true);
    });
  });
});

describe("validación de acciones", () => {
  it("rechaza un parámetro que no existe en la escena", () => {
    const result = validateAction({ type: "setParam", key: "speed", value: 5 }, "superficie");
    expect(result.ok).toBe(false);
  });

  it("ajusta un valor fuera de rango al límite del control", () => {
    const result = validateAction({ type: "setParam", key: "speed", value: 50 }, "lanzamiento");
    expect(result).toEqual({ ok: true, action: { type: "setParam", key: "speed", value: 12 } });
  });

  it("no permite reproducir en la escena Altura, que es un medidor", () => {
    expect(validateAction({ type: "play" }, "altura").ok).toBe(false);
  });
});
