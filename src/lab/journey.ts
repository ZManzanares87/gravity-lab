import type { SceneId } from "./scenes";

/**
 * Cada escena se presenta como un experimento con una pregunta.
 * La pregunta es el título: le dice a alguien sin física qué va a descubrir.
 */
export const EXPERIMENT_TITLES = {
  superficie: "¿Importa el peso al caer?",
  lanzamiento: "¿Por qué la Luna no se cae?",
  "tercer-cuerpo": "¿Y si hay tres cuerpos?",
} as const satisfies Record<SceneId, string>;
