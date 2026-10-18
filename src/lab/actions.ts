import { clampParam, SCENES, type SceneId } from "./scenes";

/**
 * Todo lo que puede cambiar el laboratorio. Los controles, los botones
 * "Comprobar" y el tutor IA usan exactamente estas acciones: ninguno puede
 * dejar la aplicación en un estado que los demás no podrían alcanzar.
 */
export type LabAction =
  | { readonly type: "loadScene"; readonly scene: SceneId }
  | { readonly type: "setParam"; readonly key: string; readonly value: number }
  | { readonly type: "play" }
  | { readonly type: "pause" }
  | { readonly type: "reset" };

export type ValidationResult =
  | { readonly ok: true; readonly action: LabAction }
  | { readonly ok: false; readonly reason: string };

/**
 * Comprueba que una acción tiene sentido en la escena actual y ajusta los
 * valores a su rango. Imprescindible para el tutor IA, que puede proponer
 * un parámetro que no existe o un valor fuera de rango.
 */
export function validateAction(action: LabAction, currentScene: SceneId): ValidationResult {
  if (action.type === "loadScene") {
    return action.scene in SCENES
      ? { ok: true, action }
      : { ok: false, reason: `La escena "${action.scene}" no existe.` };
  }

  if (action.type === "setParam") {
    const spec = SCENES[currentScene].params.find((param) => param.key === action.key);
    if (!spec) {
      return { ok: false, reason: `La escena actual no tiene el parámetro "${action.key}".` };
    }
    if (!Number.isFinite(action.value)) {
      return { ok: false, reason: `El valor de "${action.key}" no es un número válido.` };
    }
    return { ok: true, action: { ...action, value: clampParam(spec, action.value) } };
  }

  if ((action.type === "play" || action.type === "reset") && !SCENES[currentScene].run) {
    return { ok: false, reason: "Esta escena es un medidor: no tiene animación." };
  }

  return { ok: true, action };
}
