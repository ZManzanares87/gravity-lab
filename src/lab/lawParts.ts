import { EXPERIMENTS, type LawPart } from "./experiments";
import { EXPERIMENT_TITLES } from "./journey";
import { SCENE_ORDER } from "./scenes";

/** Las piezas de la ley. Las usan el diálogo de la ley y la guía del experimento. */
export const LAW_PARTS: readonly { id: LawPart; symbol: string; text: string }[] = [
  {
    id: "masa",
    symbol: "m₁ · m₂",
    text: "Las masas de los dos cuerpos: si una se duplica, la fuerza se duplica.",
  },
  {
    id: "distancia",
    symbol: "r²",
    text: "La distancia entre sus centros, al cuadrado: al doble de distancia, cuatro veces menos fuerza.",
  },
  {
    id: "universal",
    symbol: "Universal",
    text: "Todo atrae a todo: cada cuerpo tira de los demás, en la Tierra y en el espacio. Por eso se llama universal.",
  },
];

/**
 * Dónde se descubre una pieza, por ejemplo: el experimento 2, «¿Por qué la Luna no se cae?».
 * Se calcula con el orden y los títulos de los experimentos, así que no se desfasa si cambian.
 * Devuelve null si ningún experimento la descubre (un test impide que ocurra).
 */
export function whereDiscovered(part: LawPart): string | null {
  const index = SCENE_ORDER.findIndex((scene) => EXPERIMENTS[scene].discovers === part);
  const scene = SCENE_ORDER[index];
  return scene ? `el experimento ${index + 1}, «${EXPERIMENT_TITLES[scene]}»` : null;
}
