import { describe, expect, it } from "vitest";
import { SCENES } from "../scenes";
import { createLabStore } from "../store";

describe("store del laboratorio", () => {
  it("cargar una escena reinicia lo que depende de ella y conserva la sesión", () => {
    const store = createLabStore("superficie");
    store.getState().selectOption("a-la-vez");
    store.getState().check();
    store.getState().reportContacts([{ bodyId: "bola", otherBodyId: "tierra", time: 1.4 }]);

    store.getState().dispatch({ type: "loadScene", scene: "lanzamiento" });
    const state = store.getState();

    expect(state.params).toEqual(SCENES.lanzamiento.defaults);
    expect(state.selectedOption).toBeNull();
    expect(state.revealed).toBe(false);
    expect(state.finished).toBe(false);
    // Lo de la sesión sigue: la predicción y lo descubierto.
    expect(state.predictions).toEqual([{ scene: "superficie", option: "a-la-vez", correct: true }]);
    expect(state.discovered).toEqual(["masa"]);
  });

  it("reproducir sin comprobar no revela la explicación", () => {
    const store = createLabStore("superficie");
    store.getState().selectOption("a-la-vez");
    store.getState().dispatch({ type: "play" });
    store.getState().reportContacts([{ bodyId: "bola", otherBodyId: "tierra", time: 1.4 }]);

    const state = store.getState();
    expect(state.finished).toBe(true);
    expect(state.revealed).toBe(false);
    expect(state.predictions).toEqual([]);
  });

  it("cambiar un parámetro pausa y obliga a reconstruir la simulación", () => {
    const store = createLabStore("lanzamiento");
    store.getState().dispatch({ type: "play" });
    const runBefore = store.getState().runId;

    store.getState().dispatch({ type: "setParam", key: "speed", value: 7.6 });

    expect(store.getState().playing).toBe(false);
    expect(store.getState().runId).toBe(runBefore + 1);
    expect(store.getState().params.speed).toBe(7.6);
  });

  it("tras un contacto, reproducir repite el experimento", () => {
    const store = createLabStore("superficie");
    store.getState().dispatch({ type: "play" });
    store.getState().reportContacts([{ bodyId: "bola", otherBodyId: "tierra", time: 1.4 }]);
    expect(store.getState().finished).toBe(true);
    const runBefore = store.getState().runId;

    store.getState().dispatch({ type: "play" });

    expect(store.getState().finished).toBe(false);
    expect(store.getState().playing).toBe(true);
    expect(store.getState().runId).toBe(runBefore + 1);
  });

  it("en Lanzamiento, la explicación aparece tras 30 minutos simulados", () => {
    const store = createLabStore("lanzamiento");
    store.getState().check();
    store.getState().reportTime(10 * 60);
    expect(store.getState().revealed).toBe(false);
    store.getState().reportTime(30 * 60);
    expect(store.getState().revealed).toBe(true);
  });

  it("una acción rechazada no cambia nada", () => {
    const store = createLabStore("superficie");
    const before = store.getState();
    const result = store.getState().dispatch({ type: "setParam", key: "thirdMass", value: 1 });
    expect(result.ok).toBe(false);
    expect(store.getState().params).toEqual(before.params);
  });
});
