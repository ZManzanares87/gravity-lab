"use client";

import { Disclosure } from "@/ui/Disclosure";
import { useLabStore } from "../store";
import { ParamControls } from "./ParamControls";

/** "Experimenta tú" aparece en Entiende: antes, cambiar valores distraería de la predicción. */
export function ExploreControls() {
  const phase = useLabStore((state) => state.phase);
  if (phase !== "understand") return null;
  return (
    <Disclosure title="Experimenta tú" hint="cambia los valores del experimento">
      <ParamControls />
    </Disclosure>
  );
}
