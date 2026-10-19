import type { LawPart } from "./experiments";

/** Las piezas de la ley. Las usan el diálogo de la ley y la guía del experimento. */
export const LAW_PARTS: readonly { id: LawPart; symbol: string; text: string; where: string }[] = [
  {
    id: "masa",
    symbol: "m₁ · m₂",
    text: "Las masas de los dos cuerpos. Si una se duplica, la fuerza se duplica. Por eso la bola de bolos pesa más que la pelota, aunque las dos caigan igual.",
    where: "el experimento 1 (Superficie)",
  },
  {
    id: "distancia",
    symbol: "r²",
    text: "La distancia entre los centros de los dos cuerpos, al cuadrado. Al doble de distancia, un cuarto de fuerza; al triple, un noveno.",
    where: "el experimento 2 (Altura)",
  },
  {
    id: "universal",
    symbol: "Universal",
    text: "La misma ley vale para una manzana, un proyectil en órbita y la Luna. Por eso se llama ley de gravitación universal.",
    where: "el experimento 3 (Lanzamiento)",
  },
];
