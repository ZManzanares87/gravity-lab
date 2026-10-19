"use client";

import { useRef } from "react";
import type { LawPart } from "../experiments";
import { useLabStore } from "../store";

const PARTS: readonly { id: LawPart; symbol: string; text: string; where: string }[] = [
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

/**
 * La ley completa en un <dialog> nativo: el navegador mueve el foco dentro,
 * lo mantiene ahí, lo cierra con Esc y lo devuelve al botón que lo abrió.
 */
export function LawDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const discovered = useLabStore((state) => state.discovered);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex min-h-11 items-center gap-2 border border-ink bg-paper px-4 font-bold hover:bg-ink/5"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5h11a4 4 0 0 1 4 4v10H8a4 4 0 0 1-4-4z" />
          <path d="M8 9h7M8 13h5" />
        </svg>
        La ley · {discovered.length} de {PARTS.length} piezas
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="ley-titulo"
        className="m-auto max-h-[90vh] w-[min(40rem,calc(100%-2rem))] overflow-y-auto border border-ink bg-paper p-6 text-ink backdrop:bg-ink/40"
      >
        <h2 id="ley-titulo" className="text-2xl font-bold">
          La ley de gravitación universal
        </h2>
        <p className="mt-6 text-center text-3xl font-bold">F = G · m₁ · m₂ / r²</p>
        <p className="mt-2 text-center text-ink-soft">
          Dos cuerpos cualesquiera se atraen con una fuerza F.
        </p>

        <ul className="mt-6 space-y-4">
          {PARTS.map((part) => {
            const done = discovered.includes(part.id);
            return (
              <li key={part.id}>
                <p>
                  <strong>{part.symbol}:</strong> {part.text}
                </p>
                <p className="text-sm text-ink-soft">
                  {done ? `✓ Lo has descubierto en ${part.where}.` : `Por descubrir en ${part.where}.`}
                </p>
              </li>
            );
          })}
          <li>
            <p>
              <strong>G = 6,67·10⁻¹¹ N·m²/kg²:</strong> la constante de gravitación. Es diminuta:
              dos personas de 70 kg a un metro se atraen con 0,0000003 N, unos tres millones de
              veces menos que el peso de una manzana. Para notar la gravedad hace falta una masa
              enorme, como la de un planeta.
            </p>
          </li>
        </ul>

        {/* method="dialog": el formulario cierra el diálogo sin JavaScript. */}
        <form method="dialog" className="mt-6">
          <button className="bg-ink px-4 py-2 font-bold text-paper hover:bg-ink/85">Cerrar</button>
        </form>
      </dialog>
    </>
  );
}
