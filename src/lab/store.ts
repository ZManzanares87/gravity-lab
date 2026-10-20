import { create } from "zustand";
import type { Contact } from "@/physics/types";
import { validateAction, type LabAction, type ValidationResult } from "./actions";
import { EXPERIMENTS, type LawPart } from "./experiments";
import { SCENES, type Params, type SceneId } from "./scenes";

/** Una predicción del usuario, guardada durante toda la sesión. */
export interface Prediction {
  readonly scene: SceneId;
  readonly option: string;
  readonly correct: boolean;
}

export interface LabState {
  readonly sceneId: SceneId;
  /** Parámetros de la escena actual, en las unidades del usuario. */
  readonly params: Params;
  readonly playing: boolean;
  readonly speed: number;
  /**
   * Cambia cada vez que hay que reconstruir la simulación desde sus
   * condiciones iniciales (reiniciar, cambiar un parámetro, cambiar de escena).
   * El canvas lo vigila: no necesita saber por qué cambió.
   */
  readonly runId: number;
  /** Hubo contacto: el experimento ha terminado y solo se puede repetir. */
  readonly finished: boolean;
  readonly contacts: readonly Contact[];
  /** Opción marcada en la pregunta de la escena actual. */
  readonly selectedOption: string | null;
  /** En qué paso de la guía está el experimento actual. */
  readonly phase: Phase;

  // Lo que dura toda la sesión (no se reinicia al cambiar de escena).
  readonly predictions: readonly Prediction[];
  readonly discovered: readonly LawPart[];

  /** La única puerta para cambiar el laboratorio: controles, "Comprobar" e IA. */
  dispatch(action: LabAction): ValidationResult;
  setSpeed(speed: number): void;
  selectOption(option: string): void;
  /** Botón "Comprobar": ejecuta las acciones del experimento. */
  check(): void;
  /** Botón "Entender por qué": muestra la explicación cuando ya se ha visto el resultado. */
  understand(): void;
  /** Avisos del canvas. */
  reportContacts(contacts: readonly Contact[]): void;
  reportTime(time: number): void;
}

/**
 * Los pasos de cada experimento: predice, mira, ya se ha visto el resultado y entiende.
 * Una sola fase en lugar de varios booleanos: así no puede haber combinaciones imposibles.
 */
export type Phase = "predict" | "watch" | "ready" | "understand";

/** Todo lo que depende de la escena y se limpia al cargar otra. */
function sceneState(sceneId: SceneId) {
  return {
    sceneId,
    params: { ...SCENES[sceneId].defaults } as Params,
    playing: false,
    finished: false,
    contacts: [] as readonly Contact[],
    selectedOption: null,
    phase: "predict" as Phase,
  };
}

export function createLabStore(initialScene: SceneId = "superficie") {
  return create<LabState>()((set, get) => {
    /** Muestra la explicación y registra la predicción y lo descubierto. */
    const reveal = () => {
      const { sceneId, selectedOption, phase, predictions, discovered } = get();
      if (phase !== "ready") return;
      const experiment = EXPERIMENTS[sceneId];
      const part = experiment.discovers;
      set({
        phase: "understand",
        predictions: selectedOption
          ? [...predictions, { scene: sceneId, option: selectedOption, correct: selectedOption === experiment.answer }]
          : predictions,
        discovered: part && !discovered.includes(part) ? [...discovered, part] : discovered,
      });
    };

    const apply = (action: LabAction) => {
      switch (action.type) {
        case "loadScene":
          // Si es la escena en la que ya estás (el tutor la carga al preparar un experimento),
          // solo vuelve a sus valores iniciales: no borra la predicción ni devuelve a Predice.
          if (action.scene === get().sceneId) {
            set((state) => ({
              params: { ...SCENES[action.scene].defaults } as Params,
              playing: false,
              finished: false,
              contacts: [],
              runId: state.runId + 1,
            }));
            return;
          }
          set((state) => ({ ...sceneState(action.scene), runId: state.runId + 1 }));
          return;
        case "setParam":
          // Cambiar una condición inicial empieza un experimento nuevo, en pausa.
          set((state) => ({
            params: { ...state.params, [action.key]: action.value },
            playing: false,
            finished: false,
            contacts: [],
            runId: state.runId + 1,
          }));
          return;
        case "reset":
          set((state) => ({ finished: false, contacts: [], runId: state.runId + 1 }));
          return;
        case "play":
          // Tras un contacto, reproducir significa "repetir experimento".
          if (get().finished) apply({ type: "reset" });
          set({ playing: true });
          return;
        case "pause":
          set({ playing: false });
          return;
      }
    };

    return {
      ...sceneState(initialScene),
      speed: 1,
      runId: 0,
      predictions: [],
      discovered: [],

      dispatch: (action) => {
        const result = validateAction(action, get().sceneId);
        if (result.ok) apply(result.action);
        return result;
      },

      setSpeed: (speed) => set({ speed }),

      selectOption: (option) => set({ selectedOption: option }),

      check: () => {
        if (get().phase !== "predict") return;
        const { sceneId, dispatch } = get();
        const experiment = EXPERIMENTS[sceneId];
        experiment.check.forEach((action) => dispatch(action));
        set({ phase: "watch" });
      },

      understand: () => reveal(),

      reportContacts: (contacts) => {
        set({ playing: false, finished: true, contacts });
        // Solo cuenta si se llegó por "Comprobar": reproducir libremente no se salta la predicción.
        if (get().phase === "watch") set({ phase: "ready" });
      },

      reportTime: (time) => {
        const { reveal: rule } = EXPERIMENTS[get().sceneId];
        if (get().phase === "watch" && rule.on === "time" && time >= rule.after) set({ phase: "ready" });
      },
    };
  });
}

/** El store de la aplicación. Los tests crean el suyo con createLabStore(). */
export const useLabStore = createLabStore();
