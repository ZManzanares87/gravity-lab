import { EXPERIMENTS, type LawPart } from "@/lab/experiments";
import { formatNumber, formatQuantity } from "@/lab/format";
import { measure } from "@/lab/measurements";
import type { Prediction } from "@/lab/store";
import { getScene, SCENE_ORDER, type Params, type SceneId } from "@/lab/scenes";
import type { Contact, SimState } from "@/physics/types";

export interface LabSnapshot {
  readonly sceneId: SceneId;
  readonly params: Params;
  readonly playing: boolean;
  readonly finished: boolean;
  readonly contacts: readonly Contact[];
  readonly selectedOption: string | null;
  readonly revealed: boolean;
  readonly predictions: readonly Prediction[];
  readonly discovered: readonly LawPart[];
}

/**
 * Resumen en texto del estado del laboratorio para el tutor. Incluye los
 * controles con su clave y su rango, para que la IA sepa qué puede proponer,
 * y las medidas del motor, para que nunca tenga que inventar un número.
 */
export function buildLabContext(lab: LabSnapshot, live: SimState | null): string {
  const scene = getScene(lab.sceneId);
  const experiment = EXPERIMENTS[lab.sceneId];
  const lines: string[] = [];

  lines.push(`Escena actual: ${scene.title} (${lab.sceneId}).`);
  lines.push(`Escenas disponibles: ${SCENE_ORDER.join(", ")}.`);

  lines.push("Controles (clave: valor actual, rango):");
  scene.params.forEach((spec) => {
    const unit = spec.unit ? ` ${spec.unit}` : "";
    const value = lab.params[spec.key];
    lines.push(
      `- ${spec.key} ("${spec.label}"): ${value === undefined ? "?" : formatNumber(value, 4)}${unit}, de ${formatNumber(spec.min)} a ${formatNumber(spec.max)}${unit}.`,
    );
  });

  lines.push("Controles de otras escenas (antes, usa loadScene):");
  SCENE_ORDER.filter((id) => id !== lab.sceneId).forEach((id) => {
    const keys = getScene(id).params.map(
      (spec) => `${spec.key} (${formatNumber(spec.min)}–${formatNumber(spec.max)}${spec.unit ? ` ${spec.unit}` : ""})`,
    );
    lines.push(`- ${id}: ${keys.join(", ")}.`);
  });

  const status = !scene.run
    ? "medidor sin animación"
    : lab.finished
      ? "terminado tras un contacto"
      : lab.playing
        ? "reproduciéndose"
        : "en pausa";
  lines.push(`Estado: ${status}.`);

  if (live) {
    const central = live.bodies.some((body) => body.id === "tierra");
    const units = central ? { d: " m", v: " m/s", a: " m/s²", f: " N" } : { d: "", v: "", a: "", f: "" };
    lines.push(`Medidas del motor (t = ${formatNumber(live.time, 4)} s simulados):`);
    measure(live.bodies, scene.G).forEach((row) => {
      const where = central && row.altitude !== null
        ? `altura ${formatQuantity(row.altitude)}${units.d}, distancia al centro ${formatQuantity(row.distance)}${units.d}`
        : `distancia al centro ${formatQuantity(row.distance)}${units.d}`;
      lines.push(
        `- ${row.name}: masa ${formatQuantity(row.mass)}, ${where}, velocidad ${formatQuantity(row.speed)}${units.v}, aceleración ${formatQuantity(row.acceleration)}${units.a}, fuerza ${formatQuantity(row.force)}${units.f}.`,
      );
    });
  }

  if (lab.contacts.length > 0) {
    lines.push(`Contactos: ${lab.contacts.map((c) => `${c.bodyId} con ${c.otherBodyId}`).join("; ")}.`);
  }

  const chosen = experiment.options.find((option) => option.id === lab.selectedOption);
  lines.push(`Pregunta del experimento: "${experiment.question}"`);
  lines.push(
    chosen
      ? `Predicción de la persona: "${chosen.label}" (${lab.revealed ? "ya comprobada" : "aún sin comprobar"}).`
      : "La persona aún no ha elegido una predicción.",
  );
  if (lab.revealed) lines.push(`Explicación ya mostrada: "${experiment.explanation}"`);

  lines.push(
    lab.predictions.length > 0
      ? `Predicciones en la sesión: ${lab.predictions
          .map((p) => `${p.scene}: ${p.correct ? "acertó" : `no acertó (eligió "${p.option}")`}`)
          .join("; ")}.`
      : "Aún no hay predicciones en la sesión.",
  );
  lines.push(
    `Partes de la ley descubiertas: ${lab.discovered.length > 0 ? lab.discovered.join(", ") : "ninguna todavía"}.`,
  );

  return lines.join("\n");
}
