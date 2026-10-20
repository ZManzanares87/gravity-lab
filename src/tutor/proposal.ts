import type { LabAction } from "@/lab/actions";
import type { SceneId } from "@/lab/scenes";

/**
 * Qué se aplica al aceptar una propuesta del tutor. La IA prepara y la persona decide:
 * - play nunca se aplica: es la persona quien pulsa Play.
 * - abrir otro experimento se rechaza: le enseñaría el resultado de uno que aún no ha predicho.
 * Lo garantiza el código, no el prompt.
 */
export function preparableActions(
  actions: readonly LabAction[],
  currentScene: SceneId,
): { apply: LabAction[]; refused: string[] } {
  const apply: LabAction[] = [];
  const refused: string[] = [];
  for (const action of actions) {
    if (action.type === "play") continue;
    if (action.type === "loadScene" && action.scene !== currentScene) {
      refused.push("No se puede abrir otro experimento desde una propuesta.");
      continue;
    }
    apply.push(action);
  }
  return { apply, refused };
}
