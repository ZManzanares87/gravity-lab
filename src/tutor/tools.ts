import { tool } from "ai";
import { z } from "zod";
import type { SceneId } from "@/lab/scenes";

/** Las escenas, en una lista que Zod puede validar. Un test comprueba que coincide con SCENE_ORDER. */
export const SCENE_IDS = ["superficie", "altura", "lanzamiento", "tercer-cuerpo"] as const satisfies readonly SceneId[];

/** El mismo tipo de acciones que el resto de la app (LabAction), validado con Zod. */
export const labActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("loadScene"), scene: z.enum(SCENE_IDS) }),
  z.object({ type: z.literal("setParam"), key: z.string(), value: z.number() }),
  z.object({ type: z.literal("play") }),
  z.object({ type: z.literal("pause") }),
  z.object({ type: z.literal("reset") }),
]);

export const proposeExperimentInput = z.object({
  reason: z
    .string()
    .describe("Qué va a observar la persona y por qué, en una o dos frases, en español."),
  actions: z
    .array(labActionSchema)
    .min(1)
    .max(8)
    .describe("Acciones en orden. Usa loadScene antes de cambiar parámetros de otra escena."),
});

export type ProposeExperimentInput = z.infer<typeof proposeExperimentInput>;

/** Lo que recibe el modelo cuando la persona responde a una propuesta. */
export interface ProposeExperimentOutput {
  readonly accepted: boolean;
  readonly detail: string;
}

/**
 * Sin "execute": es una herramienta de cliente. El servidor no la ejecuta,
 * solo la transmite al navegador, que pide permiso a la persona antes de
 * tocar nada. El permiso lo garantiza el código, no el prompt.
 */
export const TUTOR_TOOLS = {
  proponerExperimento: tool({
    description:
      "Propone cambiar el laboratorio (escena, parámetros, reproducir...) para que la persona observe algo. La persona decide si acepta; no supongas el resultado hasta recibir la respuesta.",
    inputSchema: proposeExperimentInput,
  }),
};
