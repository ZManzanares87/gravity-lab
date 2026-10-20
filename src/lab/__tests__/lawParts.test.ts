import { describe, expect, it } from "vitest";
import { EXPERIMENTS } from "../experiments";
import { LAW_PARTS, whereDiscovered } from "../lawParts";
import { SCENE_ORDER } from "../scenes";

describe("piezas de la ley", () => {
  it.each(LAW_PARTS.map((part) => part.id))("%s la descubre exactamente un experimento", (part) => {
    expect(SCENE_ORDER.filter((scene) => EXPERIMENTS[scene].discovers === part)).toHaveLength(1);
  });

  it("dice en qué experimento se descubre cada pieza, con su número y su título", () => {
    expect(whereDiscovered("distancia")).toBe("el experimento 2, «¿Por qué la Luna no se cae?»");
  });
});
