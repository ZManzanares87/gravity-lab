import type { SimState } from "@/physics/types";

/**
 * El último estado dibujado. Vive fuera de React a propósito: el canvas lo
 * escribe en cada fotograma y el panel de datos lo lee solo 4 veces por
 * segundo, así la interfaz no se vuelve a renderizar 60 veces por segundo.
 */
let latest: SimState | null = null;

export function setLiveState(state: SimState): void {
  latest = state;
}

export function getLiveState(): SimState | null {
  return latest;
}
