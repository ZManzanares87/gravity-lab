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
      "Llegan a la vez. La Tierra tira con más fuerza de la bola de bolos (pesa unas 120 veces más), pero también cuesta 120 veces más ponerla en movimiento. Las dos cosas se compensan exactamente: la gravedad acelera igual a cualquier objeto, tenga la masa que tenga. En la vida real, una pluma cae más despacio por culpa del aire, pero aquí no hay aire.",
    discovers: "masa",
  },
  altura: {
    question:
      "La Estación Espacial está a 400 km de altura. Allí, ¿cuánto pesa un objeto comparado con lo que pesa en el suelo?",
    options: [
      { id: "nada", label: "Nada: en el espacio no hay gravedad" },
      { id: "mitad", label: "Mucho menos, más o menos la mitad" },
      { id: "casi-igual", label: "Casi lo mismo, alrededor del 90 %" },
    ],
    answer: "casi-igual",
    check: [{ type: "setParam", key: "altitude", value: 400 }],
    reveal: { on: "check" },
    explanation:
      "Casi lo mismo: un 89 %. La gravedad se debilita con la distancia al centro de la Tierra, no al suelo, y subir 400 km solo te aleja un 6 % del centro. Si sigues subiendo hasta duplicar la distancia al centro (6371 km de altura), la fuerza baja a la cuarta parte: al doble de distancia, un cuarto de fuerza. Entonces, si en la Estación Espacial hay gravedad, ¿por qué flotan los astronautas? Lo descubrirás en el siguiente experimento.",
    discovers: "distancia",
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
      "Da vueltas sin llegar al suelo, aunque en realidad está cayendo todo el tiempo. Mientras cae, avanza tan deprisa que la superficie de la Tierra, que es curva, se aleja al mismo ritmo. Eso es una órbita, y por eso flotan los astronautas: ellos y la Estación caen juntos. Es la misma gravedad que hace caer una manzana y la que mantiene a la Luna girando. Prueba también con 2 km/s y con 12 km/s.",
    discovers: "universal",
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
      "Se vuelve imprevisible. Con dos cuerpos, la ley de Newton tiene una solución exacta y la órbita se repite para siempre. Con tres, cada estrella tira de las otras dos a la vez y no hay una fórmula general: un cambio diminuto en el punto de partida acaba en un movimiento completamente distinto. Aun así, existen configuraciones muy concretas en las que tres cuerpos repiten su recorrido. Puedes verlas en la galería.",
    discovers: null,
  },
};
