import type { LabAction } from "./actions";
import type { SceneId } from "./scenes";

/** Partes de la ley que un experimento ayuda a descubrir (para "Ver la ley"). */
export type LawPart = "masa" | "distancia" | "universal";

/** Cuándo aparece la explicación del experimento. */
export type Reveal =
  | { readonly on: "check" }
  /** Tras un tiempo simulado, o antes si hay un contacto. */
  | { readonly on: "time"; readonly after: number }
  | { readonly on: "contact" };

export interface Experiment {
  readonly question: string;
  readonly options: readonly { readonly id: string; readonly label: string }[];
  readonly answer: string;
  /** Lo que hace el botón "Comprobar": las mismas acciones que el resto de la app. */
  readonly check: readonly LabAction[];
  readonly reveal: Reveal;
  readonly explanation: string;
  readonly discovers: LawPart | null;
}

export const EXPERIMENTS: Record<SceneId, Experiment> = {
  superficie: {
    question:
      "Soltamos a la vez una bola de bolos y una pelota de tenis desde la misma altura. ¿Cuál llega antes al suelo?",
    options: [
      { id: "bola", label: "La bola de bolos" },
      { id: "pelota", label: "La pelota de tenis" },
      { id: "a-la-vez", label: "Llegan a la vez" },
    ],
    answer: "a-la-vez",
    check: [{ type: "reset" }, { type: "play" }],
    reveal: { on: "contact" },
    explanation:
      "Llegan a la vez. La Tierra tira más fuerte de la bola de bolos, pero también cuesta más ponerla en movimiento, y una cosa compensa la otra.",
    discovers: "masa",
  },
  lanzamiento: {
    question:
      "Lanzamos un proyectil en horizontal a 7,6 km/s, la velocidad de la Estación Espacial. ¿Qué le pasa?",
    options: [
      { id: "cae", label: "Cae al suelo" },
      { id: "orbita", label: "Da vueltas a la Tierra sin caer" },
      { id: "escapa", label: "Se escapa al espacio" },
    ],
    answer: "orbita",
    check: [
      { type: "setParam", key: "speed", value: 7.6 },
      { type: "setParam", key: "angle", value: 0 },
      { type: "setParam", key: "launchAltitude", value: 500 },
      { type: "reset" },
      { type: "play" },
    ],
    reveal: { on: "time", after: 30 * 60 },
    explanation:
      "Da vueltas sin tocar el suelo: está cayendo todo el rato, pero avanza tan deprisa que la Tierra, que es curva, se va quedando por debajo. Así flotan los astronautas: caen a la vez que su nave. La Luna cae igual, pero está tan lejos que la Tierra tira de ella mucho más flojo.",
    discovers: "distancia",
  },
  "tercer-cuerpo": {
    question:
      "Dos estrellas giran una alrededor de la otra en una órbita perfecta. Si añadimos una tercera, ¿qué pasará?",
    options: [
      { id: "igual", label: "Seguirán girando igual" },
      { id: "poco", label: "La órbita cambiará un poco, pero se repetirá" },
      { id: "caos", label: "El movimiento se volverá imprevisible" },
    ],
    answer: "caos",
    check: [
      { type: "setParam", key: "thirdMass", value: 0.5 },
      { type: "setParam", key: "thirdDistance", value: 1.5 },
      { type: "setParam", key: "thirdSpeed", value: 0.4 },
      { type: "setParam", key: "starMass", value: 1 },
      { type: "reset" },
      { type: "play" },
    ],
    reveal: { on: "time", after: 10 },
    explanation:
      "Se vuelve imprevisible: cada estrella tira de las otras dos a la vez y no hay una fórmula que diga dónde acabarán. Solo unas pocas posiciones de partida se repiten para siempre, y las tienes en la galería.",
    discovers: "universal",
  },
};
