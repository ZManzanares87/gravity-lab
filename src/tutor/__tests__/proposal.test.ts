import { describe, expect, it } from "vitest";
import { preparableActions } from "../proposal";

describe("propuestas del tutor", () => {
  it("nunca reproduce: es la persona quien pulsa Play", () => {
    const { apply } = preparableActions(
      [{ type: "setParam", key: "speed", value: 7.6 }, { type: "play" }],
      "lanzamiento",
    );
    expect(apply).toEqual([{ type: "setParam", key: "speed", value: 7.6 }]);
  });

  it("no abre otro experimento, pero sí el actual", () => {
    const { apply, refused } = preparableActions(
      [
        { type: "loadScene", scene: "tercer-cuerpo" },
        { type: "loadScene", scene: "lanzamiento" },
      ],
      "lanzamiento",
    );
    expect(apply).toEqual([{ type: "loadScene", scene: "lanzamiento" }]);
    expect(refused).toHaveLength(1);
  });
});
