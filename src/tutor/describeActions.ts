import type { LabAction } from "@/lab/actions";
import { formatNumber } from "@/lab/format";
import { getScene, type SceneId } from "@/lab/scenes";

/**
 * Describe en palabras las acciones de una propuesta, para que la persona
 * sepa exactamente qué va a cambiar antes de aceptar. Sigue la escena a lo
 * largo de la lista: tras un loadScene, los parámetros son los de la nueva.
 */
export function describeActions(actions: readonly LabAction[], startScene: SceneId): string[] {
  let scene = startScene;
  return actions.map((action) => {
    switch (action.type) {
      case "loadScene":
        scene = action.scene;
        return `Abrir la escena ${getScene(action.scene).title}`;
      case "setParam": {
        const spec = getScene(scene).params.find((param) => param.key === action.key);
        const value = formatNumber(action.value, 4);
        return spec ? `${spec.label}: ${value}${spec.unit ? ` ${spec.unit}` : ""}` : `Cambiar ${action.key} a ${value}`;
      }
      case "play":
        return "Reproducir";
      case "pause":
        return "Pausar";
      case "reset":
        return "Reiniciar la simulación";
    }
  });
}
